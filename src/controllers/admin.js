import bcrypt from "bcrypt";
import prettyByte from "pretty-bytes";

const BCRYPT_SALT_ROUNDS = 10;

export const getAllUser = async (req, res) => {
  try {
    const results = await redis.scanAsync(["0", "MATCH", "user:*"]);
    const [_, userKeys] = results;

    const userDetails = userKeys.map(async (user) => {
      const [_, userId] = user.split(":");

      const userx = await redis.getAsync(user);
      const stat = await redis.getAsync(`statistic:${userId}`);

      return {
        user: userx,
        stat,
      };
    });

    const userValues = await Promise.all(userDetails);

    const users = userValues.map((result) => {
      const u = result.user.split(":");
      u.splice(2, 1);

      const [username, email, createdAt, lastLogin] = u;
      const [
        processed,
        bypass,
        compressed,
        byteTotal,
        saveByteTotal,
      ] = result.stat.split(":");

      return {
        username,
        email,
        stat: {
          processed,
          bypass,
          compressed,
          byteTotal: prettyByte(parseInt(byteTotal)),
          saveByteTotal: prettyByte(parseInt(saveByteTotal)),
          percentage: (
            ((parseInt(saveByteTotal) - parseInt(byteTotal)) /
              parseInt(byteTotal)) *
              100 +
            100
          ).toFixed(0),
        },
        createdAt: new Date(parseInt(createdAt)),
        lastLoginAt: new Date(parseInt(lastLogin)),
      };
    });

    res.render("users", { users });
  } catch (err) {
    res.status(500).send("Internal Server Error");
    signale.error(err);
  }
};

export const createUserView = (req, res) => {
  res.render("create-user", { csrfToken: req.csrfToken() });
};

export const createUser = async (req, res) => {
  const { username, password, email } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const createdAt = Date.now();

  const user = await redis.getAsync(`user:${username}`);

  if (user) return res.send(`user "${username}" already available!`);

  await redis.setAsync(
    `user:${username}`,
    `${username}:${email}:${passwordHash}:${createdAt}:${createdAt}`
  );
  await redis.setAsync(
    `statistic:${username}`,
    `0:0:0:0:0` // processed, bypassed, compressed, byte total, save byte total
  );

  return res.status(201).send("Created");
};

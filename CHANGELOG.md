# Change Logs

## Version 2.0.0
- Update Boilerplate (ES6, Unit Testing, and Env).
- Implement Redis
- Simple Admin Page

## Version 2.1.0
- Replace redis -> rethinkdb.
- Using tokens instead of basic authentication.
- New service path, from "/:userId" to "/s/:username/:token"
- Update admin users view

## Version 2.2.0
- Add regenerate token function in admin page.
- Make token shorten from 32 character to 6 character.
- Add rethinkdb password
- Update API Route from `admin/user` to `admin/api/user`.
- Add API Route POST: `admin/api/token`.
- Fix typo.
- Fix GZip compression problem behind nginx reserve proxy.

## Version 2.2.1
- update(docker): Make rethinkdb accessible only local
- update(admin:controller): User list orderBy created date
- update(admin:web): use VueJS
- fix(typo): jsdoc params

## Version v2.2.2
- update(express): move helmet from top-level middleware into admin route only
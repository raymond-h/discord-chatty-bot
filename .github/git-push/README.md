# git-push Github Action

Simply performs a `git push` to a given repo URL (only tested with SSH URL).
Good for pushing to Dokku or similar.

## Secrets

- `SSH_KEY`: Private key to use when pushing to ssh repo URL
- `SSH_KNOWN_HOSTS`: The contents of the `~/.ssh/known_hosts` file to use
- `TARGET_GIT_URL`: The URL to do a `git push` to (example with Dokku: `dokku@your-host.com:your-app-name`)

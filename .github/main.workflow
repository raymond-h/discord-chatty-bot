workflow "Deploy to Dokku on push" {
  on = "push"
  resolves = ["Push to Dokku"]
}

action "Filter Master Branch" {
  uses = "actions/bin/filter@3c0b4f0e63ea54ea5df2914b4fabf383368cd0da"
  args = "branch master"
}

action "Push to Dokku" {
  uses = "./.github/git-push/"
  needs = ["Filter Master Branch"]
  secrets = ["SSH_KEY", "SSH_KNOWN_HOSTS", "TARGET_GIT_URL"]
}
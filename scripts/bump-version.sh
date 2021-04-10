#!/bin/bash

# read info from manifest.json
min=$( sed -e 's/^"//' -e 's/"$//' <<< $(jq .minAppVersion manifest.json) )
version=$(jq .version manifest.json)

# write version and minAppVersion to versions.json
jq .${version}=\"${min}\" versions.json | sponge versions.json

# write minAppVersion to README.md
sed -i '' "s/available for Obsidian v.*$/available for Obsidian v${min}+./" README.md

git add versions.json README.md
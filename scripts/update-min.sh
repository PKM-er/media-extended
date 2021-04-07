echo "Enter minAppVersion (no updates press enter): "

read min
if [[ -z $min ]]
then
  # read minAppVersion from manifest.json
  min=$( sed -e 's/^"//' -e 's/"$//' <<< $(jq .minAppVersion manifest.json) )
else
  # write new minAppVersion to manifest.json
  jq .minAppVersion=${min} manifest.json | sponge manifest.json
fi
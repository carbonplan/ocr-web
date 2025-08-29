# script pointed to via https://vercel.com/carbonplan/ocr-web-prod/settings/git => ignored build step

# we still want previews
if [ "$VERCEL_ENV" != "production" ]; then
  exit 1
fi

# production: build only when HEAD is exactly at a tag
git fetch --tags --force --quiet || true
if [ -n "$(git tag --points-at HEAD)" ]; then
  exit 1   # build
else
  exit 0   # skip
fi

#!/bin/bash
#Script to push build results on the repository gh-pages branch.

# we should be in /home/travis/build/ivmartel/dwv-react
echo -e "Starting to update gh-pages\n"

pwd

ls -l

# setup git
git config --global user.email github-actions@github.com
git config --global user.name github-actions
# checkout gh-pages branch
git branch -f gh-pages upstream/gh-pages
git checkout gh-pages
# clean up demo
rm -Rf ./demo/trunk/*
# copy new build in demo/trunk
cp -Rf ./build/* ./demo/trunk
# add, commit and push files
git add ./demo/trunk/*
echo "Github actions build ${github.run_id} pushed to gh-pages"

#git commit -m "Github actions build ${github.run_id} pushed to gh-pages"
#git push -fq origin gh-pages

echo -e "Done updating.\n"

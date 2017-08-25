ITER=${1:-i00}
echo "Moving to iteration:" $ITER

echo "nodezoo-web " $ITER
cd ../nodezoo-web
git checkout $ITER

echo "nodezoo-search " $ITER
cd ../nodezoo-search
git checkout $ITER

echo "nodezoo-info " $ITER
cd ../nodezoo-info
git checkout $ITER

echo "nodezoo-npm " $ITER
cd ../nodezoo-npm
git checkout $ITER

echo "nodezoo-github " $ITER
cd ../nodezoo-github
git checkout $ITER

echo "nodezoo-updater " $ITER
cd ../nodezoo-updater
git checkout $ITER

cd ../nodezoo

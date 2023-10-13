VERSION := v$(shell cat package.json | grep -oP '"version": "(.*)"' | sed 's/"version": "\(.*\)"/\1/')

release:
	git checkout -b "release/$(VERSION)"

	rm -rf node_modules
	npm install
	npm shrinkwrap

	npm install
	npm run build

	npm run sign public/index.html
	git tag -a $(VERSION) -m ""

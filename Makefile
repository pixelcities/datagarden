VERSION := v$(shell cat package.json | grep -oP '"version": "(.*)"' | sed 's/"version": "\(.*\)"/\1/')

release:
	git checkout -b "release/$(VERSION)"

	rm -rf node_modules
	npm ci --omit=optional
	npm shrinkwrap

	npm install
	npm run build

	npm run sign datagarden-v$(VERSION).asc
	git add package-lock.json npm-shrinkwrap.json datagarden-v$(VERSION).asc
	git commit -m "Release $(VERSION)"
	git tag -a $(VERSION) -m ""

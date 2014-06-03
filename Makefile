

test:
	@node_modules/.bin/mocha \
		--harmony-generators \
		--reporter spec \
		--require co-mocha \
		--bail

.PHONY: test

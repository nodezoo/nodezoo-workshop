nodezoo - a Search Engine for Node.js Modules
===============================================================

This is the [nodezoo.com](http://nodezoo.com) project, a search engine for
[Node.js](http://nodejs.org) modules. The NodeZoo search engine is an
example of a real-world service built using Node.js
micro-services. Each micro-service is published in its own github
repository. The codebase is intended to be used as a larger-scale
example, and as a starting point for your own projects.

The search-engine is under development in an open manner, and a blog
series on the [skillsmatter.com](http://skillsmatter.com) blog covers
the full details:

   * [Introduction to Node.js Micro-services, Part 1](http://blog.skillsmatter.com/2014/09/10/build-a-search-engine-for-node-js-modules-using-microservices-part-1/)
   * [Running and Testinga Micro-service, Part 2](http://blog.skillsmatter.com/2014/09/17/build-a-search-engine-for-node-js-modules-using-microservices-part-2/)

Hosting and development is sponsored by [nearForm](http://nearform.com).


## Micro-Services

The micro-services that make up the system are:

   * [nodezoo-npm](http://github.com/rjrodger/nodezoo-npm): interface with the NPM registry
   * [nodezoo-github](http://github.com/rjrodger/nodezoo-github): interface with github.com
   * [nodezoo-index](http://github.com/rjrodger/nodezoo-index): interface with an elasticsearch server
   * [nodezoo-info](http://github.com/rjrodger/nodezoo-info): collect data on modules from multiple sources
   * [nodezoo-web](http://github.com/rjrodger/nodezoo-web): display the web site
   * [nodezoo-npm-update](http://github.com/rjrodger/nodezoo-npm-update): get live module updates
   * [nodezoo-npm-all](http://github.com/rjrodger/nodezoo-npm-all): download the full registry module list
   * [nodezoo-npm-latest](http://github.com/rjrodger/nodezoo-npm-latest): batch process the full module list download



## Iteration 00

   * _web_ (stub)

## Iteration 01

   * _web_
   * _info_  (stub)
   * _search_  (stub)

## Iteration 02

   * _web_
   * _info_
   * _search_
   * _npm_

## Iteration 03


## Iteration 04


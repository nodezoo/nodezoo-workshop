nodezoo - a Search Engine for Node.js Modules
===============================================================

This is the [nodezoo.com](http://nodezoo.com) project, a search engine
for [Node.js](http://nodejs.org) modules. The NodeZoo search engine is
an example of a real-world service built using Node.js
microservices. Each microservice is published in its own github
repository. The codebase is intended to be used as an example, and as
a starting point for your own projects.

Hosting and development is sponsored by [nearForm](http://nearform.com).


## Microservices

The micro-services that make up the system are:

   * [nodezoo-web](http://github.com/rjrodger/nodezoo-web): the web server
   * [nodezoo-info](http://github.com/rjrodger/nodezoo-info): collect data on modules from multiple sources
   * [nodezoo-search](http://github.com/rjrodger/nodezoo-search): interface with an elasticsearch server
   * [nodezoo-npm](http://github.com/rjrodger/nodezoo-npm): interface with the NPM registry
   * [nodezoo-github](http://github.com/rjrodger/nodezoo-github): interface with github.com
   * [nodezoo-npm-update](http://github.com/rjrodger/nodezoo-npm-update): get live module updates


## Iterations

The system is built in a set of iterations so that you can follow its
development. This mirrors the way that real microservice projects are
developed. Each iteration, more services are introduced.

When working with the individual microservices, it is easier to open a
separate terminal for each one.

Not all microservices are available in all iterations, as some are
only introduced later.

Each iterations contains a set of tasks to execute. You should try to
get them all up and running to verify to yourself that you understand
the mechanics of the system.

Each iteration also includes a set of experiments that you can
attempt. Use these to develop your understanding of the system - there
are no right answers!


## Requirements

The basic tools are:

   * [Node.js 4](http://nodejs.org)
   * [Docker 1.8](http://docker.com)

Install these before getting started. Later iterations introduce additional tools, and these will be indicated.

### A Note on Docker

This example only places microservices into containers. All other
services (e.g. redis) are run as normal from the host machine. This does not
prevent you from containerising them of course!

To use the _docker_ command in a terminal, you need to set up the docker environment variables.
From the initial docker terminal (as provided by the docker installation), you can run

```sh
$ docker-machine env default
```

to obtain these environment settings. Copy and paste them into new terminals as needed.

Docker runs containers in a host machine. You use the IP address of this host to access containers.
The easiest way to get this IP address is to run the command:

```sh
$ docker-machine ip default
```

Finally, from inside docker containers, your microservices will need to tall to the outside world.
To do this, they use a special IP address representing your host machine. You can obtain this address in multiple ways:

   * run `ifcongig -a` and look for the docker or virtualbox entries.
   * run `docker-machine inspect default | grep HostOnly`

Docker networking can be tricky, and is fragile with respect to network changes, with DNS, for example, failing.
When wierdness happens, your best bet is to restart:

```sh
$ docker-machine restart default
```

This will invalidate your environment, so you will need to launch a new docker terminal.


## How to use this code

Each microservice repository has a branch for each iteration: i00, i01, etc.
You can clone these branches directly - for example:

```sh
$ git clone -b i00 https://github.com/rjrodger/nodezoo-web.git nodezoo-web-i00
```

However you will not be able to save your changes to your own repositories.

To save your own work, it is better to first fork the repository on github.com, and then

```sh
$ git clone git@github.com:<YOUR_USER>/nodezoo-web.git
$ cd nodezoo-web
$ git remote add upstream https://github.com/rjrodger/nodezoo-web.git
$ git fetch upstream
$ git checkout upstream/i00
$ git checkout -b i00
```

This sequence of commands downloads the branch into your local clone of your fork.
You can then push your changes back to your own fork.

In each branch, you always need to 

```sh
$ npm install
```

to get the dependent Node.js modules.



## Iteration 00: Getting Started

Branch name: `i00`

### microservices
   * _web_ (stub)

### tasks
   * Clone the microservice.
   * Review code.
   * Run in terminal with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log.all`
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Open http://localhost:8000 - all searches return "foo"
     * Open http://localhost:8000/info/express - all info is for "foo"
     * Use the HTTP API:
       * `$ curl "http://localhost:44000/act?role=search&cmd=search&query=express"`
     * Use the repl:
       * `$ telnet localhost 43000`
       * `> seneca.list('role:search')`
       * '> role:search,cmd:search,query:express'      
   * Docker image and container: build and run
     * Use commands in Dockerfile
     * Verify functionality as above, against docker host IP

### experiments

   * Learn some [hapi](http://hapijs.com): add some more API end points
     * how about /api/ping, and respond with the time?
   * Learn some [seneca](http://senecajs.org): add some more actions, and expose them as API end points
     * how about /api/ping triggers role:web,cmd:ping, and that responds with the time
   * The front end is old-school jQuery - how about some [react](http://reactjs.com)?
   * Setup nginx as a load-balancer with multiple instances of _web_ running
     * update the configuration to handle port conflicts


## Iteration 01: 3 Microservices

Branch name: `i01`

   * _web_
   * _info_  (stub)
   * _search_  (stub)

## Iteration 02: Real Functionality

Branch name: `i02`

   * _web_
   * _info_
   * _search_
   * _npm_

   * _redis_
   * _elasticsearch_

## Iteration 03: Measurement

Branch name: `i03`

   * _web_ (stats)
   * _info_ (stats)
   * _search_
   * _npm_
   * _github_

   * _redis_
   * _elasticsearch_
   * _influxdb_
   * _grafana_
   * _msgstats_

## Iteration 04: Enhancement

Branch name: `i04`

   * _web_ (stats)
   * _info_ (stats)
   * _search_
   * _npm_
   * _github_
   * _update_

   * _redis_
   * _elasticsearch_
   * _influxdb_
   * _grafana_
   * _msgstats_

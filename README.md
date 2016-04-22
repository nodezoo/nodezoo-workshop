![Nodezoo][Banner]

# nodezoo-workshop

- __Lead:__ [Richard Rodger][Lead]
- __Sponsor:__ [nearForm][Sponsor]

A workshop for the [nodezoo](http://nodezoo.com) project. Nodezoo is a search engine for
[Node.js](http://nodejs.org) modules. The nodezoo search engine is an example of a real-world
service built using Node.js microservices. Each microservice is published in its own github
repository along with all of the necessary config to run the system locally or live . The codebase
is intended to be used as an example, and as a starting point for your own projects.

Below we provide a complete workshop to work through. Our current live system has it's roots in
this workshop. By working through the iterations below you can get a feel for how a microservice
system is bootstrapped together and how the system evolves as needs change.

__Note:__ This repo contains the nodezoo workshop, to explore and run the live version of nodezoo,
please see [nodezoo-system][] project.



## Microservices

The micro-services that make up the system are:

   * [nodezoo-web](http://github.com/nodezoo/nodezoo-web): the web server
   * [nodezoo-info](http://github.com/nodezoo/nodezoo-info): collect data on modules from multiple sources
   * [nodezoo-search](http://github.com/nodezoo/nodezoo-search): interface with an elasticsearch server
   * [nodezoo-npm](http://github.com/nodezoo/nodezoo-npm): interface with the NPM registry
   * [nodezoo-github](http://github.com/nodezoo/nodezoo-github): interface with github.com
   * [nodezoo-npm-update](http://github.com/nodezoo/nodezoo-npm-update): get live module updates

Each service should be downloaded and placed in the same folder including this repository.

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

Finally, from inside docker containers, your microservices will need to talk to the outside world.
To do this, they use a special IP address representing your host machine (Host IP). You can obtain this address in multiple ways:

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
$ git clone -b i00 https://github.com/nodezoo/nodezoo-web.git nodezoo-web-i00
```

However you will not be able to save your changes to your own repositories.

To save your own work, it is better to first fork the repository on github.com, and then

```sh
$ git clone https://github.com/[YOUR_USER]/nodezoo-web.git
$ cd nodezoo-web
$ git remote add upstream https://github.com/nodezoo/nodezoo-web.git
$ git fetch upstream
$ git checkout upstream/i00
$ git checkout -b i00
```

This sequence of commands downloads the branch into your local clone of your fork.
You can then push your changes back to your own fork.


One you have downloaded all the branches, you can switch between them,
across all microservice repositories using the `iteration.sh` script:


```
$ ./iteration.sh i00 # moves all to iteration 00
$ ./iteration.sh i01 # moves all to iteration 01
... etc.
```

These commands must be used before using the above script, for each branch for the first time :
```
$ git checkout upstream/[BRANCH NAME]
$ git checkout -b [BRANCH NAME]
```

## Install your dependencies
This script only works once the branch has been fully set-up for a first time.

In each branch, you always need to run the following command:
```
npm install
```
Then go into the folder nodezoo-workshop/system and run:
```
npm install
```
to get the dependent Node.js modules.
This must be done each time a branch is changed for each micro-service.
## Run build

In the folder nodezoo-web use the following command :
```
npm run build
```
IMPORTANT NOTE: the build command is not required on branch i00 - i05


## Iteration 00: Getting Started
### Branch name: `i00`

This branch starts with a simple web server. Use this branch to validate your configuration.

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
       * `> role:search,cmd:search,query:express`      
   * Docker image and container: build and run
     * Open the Dockerfile in a text editor and the commands to use that Dockerfile are in its comments
     * The command `$ docker build -t TAG-NAME .` tells docker to build with the tag TAG-NAME using the Dockerfile in the current directory
     * Verify functionality as above, against docker host IP
       * If Docker cannot connect to the Docker daemon during building use the following command before building:
       `$ eval "$(docker-machine env default)"`

### experiments

   * Learn some [hapi](http://hapijs.com): add some more API end points
     * how about /api/ping, and respond with the time?
   * Learn some [seneca](http://senecajs.org): add some more actions, and expose them as API end points
     * how about /api/ping triggers role:web,cmd:ping, and that responds with the time
   * The front end is old-school jQuery - how about some [react](http://reactjs.com)?
   * Setup nginx as a load-balancer with multiple instances of _web_ running
     * update the configuration to handle port conflicts


## Iteration 01: 3 Microservices
### Branch name: `i01`

This branch introduces two microservices that support the web
service. Both are stubs that perform no actual work, instead returning
hard-coded responses. The focus here is on understanding how simple
microservice communication is configured using static addressing with
fixed IP addresses and ports.

### microservices
  * _web_
  * _info_  (stub)
  * _search_  (stub)

### tasks
   * Clone the microservices.
   * Review code for each one - in particular the message transport configuration.
   * Run in separate terminals with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log.all`
     * `node srv/info-dev.js --seneca.options.tag=info --seneca.log.all`
     * `node srv/search-dev.js --seneca.options.tag=search --seneca.log.all`
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Open http://localhost:8000 - all searches return "bar"
     * Open http://localhost:8000/info/express - all info is for "bar"
     * Use the HTTP API:
       * `$ curl "http://localhost:44000/act?role=search&cmd=search&query=express"`
     * Use the repl of each microservice, and test its action patterns
   * Build and run the Docker containers, and verify the same functionality

### experiments
   * Add another microservice
     * ... perhaps ping can live in its own service?
   * How would you unit test this code?
     * testing the inbound and outbound messsages for each action is a good place to start
   * What happens when microservices are down?
     * Perhaps an auto-restarter like [forever](https://github.com/foreverjs/forever) might help
   * Place the _info_ and/or _search_ microservices behind nginx
     * and run multiple instances of them - scaling!
     * and run multiple versions - fine-grained deployment!
       * a simple change is to return 'zed' instead of 'bar'
   * Seneca lets you merge microservices into one process
     * just seneca.use each microservice inside _web_

## Iteration 02: Real Functionality
### Branch name: `i02`

This branch introduces infrastructure services that are used by the
microservices to perform work. Elasticsearch is used as a search
engine, and Redis is used for publish/subscribe messaging. The search
can now index and search for Node.js modules, with some manual help.

### Prerequisites

   * Install [redis](http://redis.io/) and run in default configuration
   * Install [elasticsearch](https://www.elastic.co/) and run in default configuration
   * Clone the [nodezoo](https://github.com/nodezoo/nodezoo-workshop) repository, and build the _nodezoo-level_ container
     * See folder `docker/level`; run `npm install first`
     * This is necessary, as the _seneca-level-store_ module must compile binaries

### microservices

   * _web_
   * _info_
   * _search_
   * _npm_

### supporting services

   * _redis_
   * _elasticsearch_

### tasks
   * Clone the microservices.
   * Review code for each one - in particular the external intergrations.
   * Run in separate terminals with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log.all`
     * `node srv/info-dev.js --seneca.options.tag=info --seneca.log.all`
     * `node srv/search-dev.js --seneca.options.tag=search --seneca.log.all`
     * `node srv/npm-dev.js --seneca.options.tag=npm --seneca.log.all`
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Open http://localhost:8000/info/request - adds _request_ to the search engine
       * Manually change the module name in the URL to index other modules.
     * Open http://localhost:8000 - searches now work! Try "request".
     * Use the HTTP API:
       * `$ curl "http://localhost:44000/act?role=search&cmd=search&query=express"`
     * Use the repl of each microservice, and test its action patterns
   * Build and run the Docker containers, and verify the same functionality

### experiments

   * Add another info microservice
     * copy npm, and then modify
     * perhaps it would be useful to know something about the author(s) of the module?
   * What happens when microservices are down? and what about redis and elasticsearch?
   * Can you run multiple copies of _npm_
     * what happens?
   * If you used nginx for scaling, does it still work?
   * Elasticsearch might run slow - is there a way to deal with this?
     * what about a separate caching microservice that sits in front of _search_?


## Iteration 03: Measurement

### Branch name: `i03`

This branch uses influxdb and grafana to chart message flow rates
through the system. Influxdb is used due to it's ease of installation and because it is based on plotting time-series data. Grafana is used because it officially supports influx, and is relatively easy to use.

### Prerequisites

   * Install [influxdb](https://influxdb.com/) and run in default configuration
     * Start influxdb with `$ influxd run`
     * Set up your database by running the console `$ influx`

```sql
> CREATE DATABASE seneca_msgstats;
> CREATE USER msgstats WITH PASSWORD 'msgstats';
> GRANT ALL ON seneca_msgstats TO msgstats;
```

   * Install [grafana](http://grafana.org/) and run in default configuration
     * You'll need to add your [influxdb](http://docs.grafana.org/datasources/influxdb/) as data source and setup a [dashboard](http://docs.grafana.org/guides/gettingstarted/).
     * Action flow rates can be obtained using queries of the form:
       * `SELECT SUM(c) FROM "cmd:search,role:search" WHERE time > now() - 100s GROUP BY time(1s)`
   * In your clone of the main _nodezoo_ repository, run the msgstats service:
     * located in the `system` folder
     * `npm install` first as usual
     * run with `HOST=localhost|host-ip node msgstats.js`
     * use host-ip for docker scenario
   * You'll need a personal access token for the github.com API
     * See the menu item under account settings on github.com

### microservices

   * _web_ (stats)
   * _info_ (stats)
   * _search_
   * _npm_
   * _github_

### supporting services

   * _redis_
   * _elasticsearch_
   * _influxdb_
   * _grafana_
   * _msgstats_

### tasks
   * Clone the microservices.
   * Review code for each one - in particular the message statistics collection.
   * Run in separate terminals with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log.all`
     * `node srv/info-dev.js --seneca.options.tag=info --seneca.log.all`
     * `node srv/search-dev.js --seneca.options.tag=search --seneca.log.all`
     * `node srv/npm-dev.js --seneca.options.tag=npm --seneca.log.all`
     * `node srv/github-dev.js --seneca.options.tag=npm --seneca.log.all --seneca.options.plugin.github.token=YOUR_GITHUB_TOKEN`
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Use the website, API and repl as before
   * Verify that message flow rate charts are generated in grafana
   * Build and run the Docker containers, and verify the same functionality

### experiments

   * Write a test script to generate queries via HTTP and then observe the charts
     * the message flow rates should remain relatively proportional to each other
   * Write a seneca plugin that induces a failure rate on a given set of messages
     * read the article on [priors](http://senecajs.org/tutorials/understanding-prior-actions.html)
     * run this on _npm_ and _github_ - does running more instances of these services help?
   * Can you implement a rate limiter?
     * Use your test script to overload the system
     * Use a plugin to implement the rate limiting
     * It's ok to drop excess load on the floor (aka "load-shedding")


## Iteration 04: Enhancement
### Branch name: `i04`

This branch shows the use of a message bus to avoid the high coupling and configuration costs of
direct service-to-service communication. This is one way to avoid the need for service discovery
solutions.

### Prerequisites

   * Install [beanstalkd](http://kr.github.io/beanstalkd/) and run in default configuration

### microservices

   * _web_ (stats)
   * _info_ (stats)
   * _search_
   * _npm_ (stats)
   * _github_
   * _update_ (stats)

### supporting services

   * _redis_
   * _elasticsearch_
   * _influxdb_
   * _grafana_
   * _msgstats_

### tasks
   * Clone the microservices.
   * Review code for each one - in particular the npm update event emitter.
   * Run in separate terminals with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log.all`
     * `node srv/info-dev.js --seneca.options.tag=info --seneca.log.all`
     * `node srv/search-dev.js --seneca.options.tag=search --seneca.log.all`
     * `node srv/npm-dev.js --seneca.options.tag=npm --seneca.log.all`
     * `node srv/github-dev.js --seneca.options.tag=npm --seneca.log.all --seneca.options.plugin.github.token=YOUR_GITHUB_TOKEN`
     * `node srv/update-dev.js --seneca.options.tag=update --seneca.log.all --seneca.options.plugin.npm_update.task=registry_subscribe`
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Use the website, API and repl as before
   * Verify that live npm publishes are registered  
   * Verify that message flow rate charts are generated in grafana
   * Build and run the Docker containers, and verify the same functionality

### experiments

   * The npm-update microservice also provides download and batch functionality
     * experiment with these (look at the source to see the action patterns)
     * use the repl to control and observe
   * In production, how can you ensure that you have all the npm registry data?
     * which configuration of npm-update instances do you run?
   * A long time ago, in a galaxy far away, the original nodezoo could calculate "node rank", which is just like "page rank" only for node modules.
     * https://github.com/nodezoo/nodezoo-workshop/tree/bdd18c030ef32f19e0b28e1f7ed30f80a9854b59/bin
     * Perhaps this can be turned into a batch processing microservice?


### Iteration 05: Mesh Networking
### Branch name: `i05`

This branch shows the use of mesh networking to completely remove the need for service discovery.
The [seneca-mesh](https://github.com/rjrodger/seneca-mesh) plugin uses the [SWIM gossip algorithm](http://www.cs.cornell.edu/~asdas/research/dsn02-SWIM.pdf)
to enable microservices to automatically discover the appropriate destinations for messages dynamically.

### Prerequisites

   * In your clone of the main _nodezoo_ repository, run the base-node service:
     * located in the `system` folder
     * `npm install` first as usual
     * run with `node base-node.js`

### microservices

   * _web_
   * _info_
   * _search_
   * _npm_
   * _github_
   * _update_

### supporting services

   * _influxdb_
   * _grafana_
   * _msgstats_
   * _base-node_

### tasks
   * Clone the microservices.
   * Review code for each one - in particular the updated service scripts in the `srv` folders.
   * Make sure to run the _base-node_ service *before* starting the microservices.
   * Run in separate terminals with
     * `node srv/app-dev.js --seneca.options.tag=web --seneca.log=type:act --seneca.options.debug.short_logs=true`
     * `node srv/info-dev.js --seneca.options.tag=info --seneca.log=type:act --seneca.options.debug.short_logs=true`
     * `node srv/search-dev.js --seneca.options.tag=search --seneca.log=type:act --seneca.options.debug.short_logs=true`
     * `node srv/npm-dev.js --seneca.options.tag=npm --seneca.log=type:act --seneca.options.debug.short_logs=true`
     * `node srv/npm-github.js --seneca.options.tag=npm --seneca.log=type:act --seneca.options.debug.short_logs=true --seneca.options.plugin.github.token=YOUR_GITHUB_TOKEN`
     * `node srv/update-dev.js --seneca.options.tag=update --seneca.log=type:act --seneca.options.debug.short_logs=true --seneca.options.plugin.npm_update.task=registry_subscribe`
     * These logging options add a filter to show only actions, and also shorten the logs so they are easier to see for debuggin.
   * Verify functionality:
     * Observe the seneca logs to follow the execution of action patterns
     * Use the website and API as before.
   * Verify that live npm publishes are registered  
   * Verify that message flow rate charts are generated in grafana
   * Build and run the Docker containers, and verify the same functionality

### experiments

   * Try stopping and starting services at random.
     * Observe how the mesh network dynamically reconfigures the microservice message flows.
   * Try running multiple instances of the _search_ service.
     * Observe that the _web_ service automatically load balances between the current _search_ services dynamically.


## Contributing
The [NodeZoo org][Org] encourages __open__ and __safe__ participation.

- __[Code of Conduct][Coc]__

If you feel you can help in any way, be it with documentation, examples, extra testing, or new
features please get in touch.

## License
Copyright (c) 2014-2016, Richard Rodger and other contributors.
Licensed under [MIT][Lic].

[Banner]: https://raw.githubusercontent.com/nodezoo/nodezoo-org/master/assets/logo-nodezoo.png
[Sponsor]: http://www.nearform.com/
[Lead]: https://github.com/rjrodger
[Lic]: ./LICENSE
[Coc]: https://github.com/nodezoo/nodezoo-org/blob/master/CoC.md
[Org]: http://www.nodezoo.com/

[nodezoo-system]: https://github.com/nodezoo/nodezoo-system

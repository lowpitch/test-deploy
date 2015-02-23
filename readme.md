# Pals United #







**This project requires Node and Gulp**

1. [Node.js] (http://nodejs.org/) is used for the building of the project. Version 0.8 or higher should work.
2. [Gulp] (http://gulpjs.com/) is used to concatenate and minify Javascript and CSS assets.



### Setup ###

```shell
$ npm install
```




**Start the project**

```shell
$ gulp server
$ gulp
```



**View locally**

http://localhost:3000 - local dev

http://localhost:3333 - local production (requires ```$ gulp dev``` to be run)




**Build the project distributable**

```shell
$ gulp dev
```

```shell
$ gulp staging
```

```shell
$ gulp production
```

These will live inside the ```dist``` directory
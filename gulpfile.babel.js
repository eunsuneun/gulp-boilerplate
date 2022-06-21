const gulp = require("gulp");
const { series, parallel } = require("gulp");
const del = require("del");
const pug = require("gulp-pug");
const sass = require("gulp-sass")(require("sass"));
const minifyCSS = require("gulp-csso");
const autoprefixer = require("gulp-autoprefixer");
const browserSync = require("browser-sync").create();
const image = require("gulp-image");
const bro = require("gulp-bro");
const babelify = require("babelify");
const ghPages = require("gulp-gh-pages");

// 경로
const routes = {
  pug: {
    watch: "src/**/*.pug",
    src: "src/*.pug",
    dest: "build",
  },
  img: {
    src: "src/img/*",
    dest: "build/img",
  },
  scss: {
    watch: "src/scss/**/*.scss",
    src: "src/scss/*.scss",
    dest: "build/css",
  },
  js: {
    watch: "src/js/**/*.js",
    src: "src/js/main.js",
    dest: "build/js",
  },
};

// clean build folder
function clean() {
  return del(["build", ".publish"]);
}

// build images
function img() {
  return gulp
    .src(routes.img.src)
    .pipe(image())
    .pipe(gulp.dest(routes.img.dest));
}

// compile pug into html
function html() {
  return gulp.src(routes.pug.src).pipe(pug()).pipe(gulp.dest(routes.pug.dest));
}

// compile scss into css
function style() {
  return gulp
    .src(routes.scss.src)
    .pipe(sass().on("error", sass.logError))
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(gulp.dest(routes.scss.dest))
    .pipe(browserSync.stream());
}

// compile modern JS into old JS
function js() {
  return gulp
    .src(routes.js.src)
    .pipe(
      bro({
        transform: [
          babelify.configure({ presets: ["@babel/preset-env"] }),
          ["uglifyify", { global: true }],
        ],
      })
    )
    .pipe(gulp.dest(routes.js.dest));
}

// deploy github pages
function gh() {
  return gulp.src("build/**/*").pipe(ghPages());
}

// live watching
function watch() {
  browserSync.init({
    server: {
      baseDir: "./build/",
    },
  });
  gulp.watch(routes.scss.watch, style);
  gulp.watch(routes.pug.watch, html).on("change", browserSync.reload);
  gulp.watch(routes.js.watch, js).on("change", browserSync.reload);
}

const prepare = series([clean, img]);
const assets = series([html, style, js]);
const live = parallel([watch]);

export const build = gulp.series([prepare, assets]);
export const dev = gulp.series([build, live]);
export const deploy = gulp.series([build, gh, clean]);

const gulp = require('gulp');
const del = require('del');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

function clean() {
  return del('./public');
}

function html() {
  return gulp.src('./src/views/*.pug')
    .pipe(pug({
      doctype: 'html',
      pretty: false
    }))
    .pipe(gulp.dest('./public/'));
}

function css() {
  return gulp.src('./src/scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./public/css'));
}

function js() {
  return gulp.src('./src/scripts/**/*.js')
    .pipe(concat('main.js'))
    .pipe(gulp.dest('./public/js/'));
}

function serviceWorker() {
  return gulp.src('./src/service-worker/service-worker.js')
    .pipe(gulp.dest('./public/'));
}


gulp.task('default', () => {
  gulp.watch('./src', gulp.series(html, css, js, serviceWorker));
});

gulp.task('build',gulp.series(clean, html, css, js, serviceWorker));


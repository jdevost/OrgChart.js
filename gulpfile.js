var gulp = require('gulp'),
  eslint = require('gulp-eslint'),
  babel = require('gulp-babel'),
  uglify = require('gulp-uglify'),
  rename = require("gulp-rename"),
  csslint = require('gulp-csslint'),
  browserSync = require('browser-sync').create(),
  gutil = require('gulp-util'),
  webpack = require('webpack'),
  cleanCSS = require('gulp-clean-css'),
  sourcemaps = require('gulp-sourcemaps'),
  path = require('path'),
  del = require('del'),
  merge = require('merge-stream');

gulp.task('cleanCSS', () =>
  del(['build/css'])
);
gulp.task('cleanJS', () =>
  del(['build/js'])
);

gulp.task('csslint', gulp.series(() =>
  gulp.src('src/*.css')
    .pipe(csslint({
      'adjoining-classes': false,
      'box-sizing': false,
      'box-model': false,
      'fallback-colors': false,
      'order-alphabetical': false
    }))
    .pipe(csslint.formatter())
));

gulp.task('css', gulp.series('csslint', 'cleanCSS', () =>
  gulp.src('src/*.css')
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(rename('orgchart.min.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'))
    .pipe(gulp.dest('demo/css'))
));

gulp.task('eslint', gulp.series(() =>
  gulp.src(['src/*.js'])
    .pipe(eslint('.eslintrc.json'))
    .pipe(eslint.format())
    .pipe(eslint.failOnError())
));

gulp.task('js', gulp.series('eslint', 'cleanJS', () =>
  gulp.src(['src/*.js'])
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ["@babel/preset-env"]
    }))
    .pipe(uglify())
    .pipe(rename('orgchart.min.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/js'))
    .pipe(gulp.dest('demo/js'))
));

gulp.task('watch', gulp.series((done) => {
  gulp.watch('src/*.js', gulp.series('js'));
  gulp.watch('src/*.css', gulp.series('css'));
  done();
}));

gulp.task('copyVendorAssets', gulp.series(() => {
  var fontawesomeCSS = gulp.src('node_modules/font-awesome/css/font-awesome.min.css')
    .pipe(gulp.dest('demo/css/vendor'));

  var fontawesomeFonts = gulp.src('node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('demo/css/fonts'));

  var html2canvas = gulp.src('node_modules/html2canvas/dist/html2canvas.min.js')
    .pipe(gulp.dest('demo/js/vendor'));

  return merge(fontawesomeCSS, fontawesomeFonts, html2canvas);
}));

gulp.task('build', gulp.series('css', 'js'));

gulp.task('webpack', gulp.series('build', () => {
  webpack(require('./webpack.config.js'), function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }
    gutil.log('[webpack]', stats.toString());
  });
}));

gulp.task('serve', gulp.series('copyVendorAssets', 'webpack', (done) => {
  browserSync.init({
    files: ['src/*.css', 'demo/**/*.html', 'demo/**/*.css', '!demo/css/vendor/*.css'],
    server: 'demo',
    socket: {
      domain: 'localhost:3000'
    }
  });

  gulp.watch('src/*.js', gulp.series('webpack'));

  gulp.watch('demo/js/*').on('change', browserSync.reload);

  gulp.watch(['demo/**/*.js', '!demo/js/*', '!demo/js/vendor/*', '!demo/**/bundle*.js']).on('change', function (file) {
    webpack({
      entry: file.path,
      output: {
        path: path.dirname(file.path),
        filename: 'bundle.js'
      },
      devtool: 'source-map',
      module: {
        rules: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }]
      }
    }, function (err, stats) {
      if (err) {
        throw new gutil.PluginError('webpack', err);
      }
      browserSync.reload();
    });
  });

  done();

}));

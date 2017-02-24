'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');

const BundleFolder = require('./BundleFolder');

/**
 * File Manager for bundles
 *
 * @class BundleFileManager
 */
class BundleFileManager {

  constructor(state) {
    this.state = state;
    this.excludedBuilderBundles = this.state.Config.get('excludedBuilderBundles', []);
    this.bundles = [];
  }

  loadBundles(baseDirectory) {
    this.basePath = path.join(baseDirectory, "bundles");

    const bundles = fs.readdirSync(this.basePath);

    for (const bundle of bundles) {
      const bundlePath = path.join(this.basePath, bundle);
      if (fs.statSync(bundlePath).isFile() || bundle === '.' || bundle === '..') {
        continue;
      }

      // only load bundles we allow builders to manage
      if (this.excludedBuilderBundles.indexOf(bundle) > -1) {
        continue;
      }

      this.loadBundle(bundle);
    }

    const watcher = chokidar.watch(this.basePath, {ignoreInitial: true});

    watcher.on('addDir', newDir => {
      this.loadBundle(path.basename(newDir));
    });
  }

  loadBundle(bundleName) {
    this.bundles[bundleName] = new BundleFolder(this.state, bundleName, path.join(this.basePath, bundleName)).load();
  }

  getBundles() {
    return this.bundles;
  }

  bundleExists(bundleName) {
    return fs.existsSync(path.join(this.basePath, bundleName));
  }


  /**
   * Get a bundle directory by name
   * 
   * @param {any} bundleName 
   * @returns BundleFolder
   * 
   * @memberOf BundleFileManager
   */
  getBundleDirectory (bundleName) {
    return this.bundles[bundleName];
  }

  /**
   * Create a new bundle directory
   *
   * @returns 
   *
   * @memberOf BundleFileManager
   */
  createBundle(bundleName) {
    if (this.bundleExists(bundleName)) {
      throw new Error(`Bundle ${bundleName} already exists`);
    }

    const newBundlePath = path.join(this.basePath, bundleName);
    const newBundleAreasPath = path.join(this.basePath, bundleName, 'areas');

    fs.mkdirSync(newBundlePath);
    fs.mkdirSync(newBundleAreasPath);

    this.bundles[bundleName] = new BundleFolder(this.state, bundleName, path.join(this.basePath, bundleName)).load();
  }

}

module.exports = BundleFileManager;
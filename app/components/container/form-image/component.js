import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import layout from './template';
import { get, set, observer, computed } from '@ember/object'
import { debouncedObserver } from 'ui/utils/debounce';


// Remember the last value and use that for new one
var lastContainer = 'ubuntu:xenial';

export default Component.extend({
  scope:  service(),
  harbor: service(),

  layout,
  // Inputs
  initialValue: null,
  errors:       null,

  userInput:    null,
  tagName:      '',
  value:        null,
  allPods:      null,
  harborImages: {
    raw:  [],
    urls: [],
  },
  harborServer:        null,
  harborImageTags: [],
  imageTag:        null,

  init() {
    this._super(...arguments);
    set(this, 'allPods', get(this, 'store').all('pod'));

    let initial = get(this, 'initialValue') || '';

    if ( !initial ) {
      initial = lastContainer;
    }

    scheduleOnce('afterRender', () => {
      this.send('setInput', initial);
      this.userInputDidChange();
      this.loadHarborServerUrl();
    });
  },

  actions: {
    setInput(str) {
      set(this, 'userInput', str);
    },
  },

  userInputDidChange: observer('userInput', function() {
    var input = (get(this, 'userInput') || '').trim();
    var out;

    if ( input && input.length ) {
      lastContainer = input;
      out = input;
    } else {
      out = null;
    }

    set(this, 'value', out);
    this.sendAction('changed', out);
    this.validate();
  }),
  imageTagDidChanged: observer('imageTag', function() {
    const tag = get(this, 'imageTag');

    if (tag) {
      const input = get(this, 'userInput');
      const index = input.indexOf(':');

      if ( index > -1) {
        set(this, 'userInput', `${ input.substr(0, index) }:${ tag }`)
      } else {
        set(this, 'userInput', `${ input }:${ tag }`)
      }
    }
  }),
  searchImages: debouncedObserver('userInput', function() {
    var input = (get(this, 'userInput') || '').trim();

    this.loadImagesInHarbor(input);
  }),
  suggestions: computed('allPods.@each.containers', 'harborImages', function() {
    let inUse = [];

    get(this, 'allPods').forEach((pod) => {
      inUse.addObjects(pod.get('containers') || []);
    });

    inUse = inUse.map((obj) => (obj.get('image') || ''))
      .filter((str) => !str.includes('sha256:') && !str.startsWith('rancher/'))
      .uniq()
      .sort();

    return {
      'Used by other containers':             inUse,
      'Images in harbor image repositories': get(this, 'harborImages').urls,
    };
  }),

  harborRepo: computed('harborServer', function() {
    const serverUrl = get(this, 'harborServer');

    if (!serverUrl) {
      return null;
    }
    const repo = serverUrl.indexOf('://') > -1 ? serverUrl.substr(serverUrl.indexOf('://') + 3) : serverUrl;

    if (repo.endsWith('/')) {
      return repo.substr(0, repo.length - 2);
    }

    return repo;
  }),
  validate() {
    var errors = [];

    if ( !get(this, 'value') ) {
      errors.push('Image is required');
    }

    set(this, 'errors', errors);
  },
  loadImagesInHarbor(query) {
    if (!get(this, 'harborServer')) {
      return;
    }
    let input = query;

    if (!input) {
      set(this, 'harborImages', {
        raw:  [],
        urls: [],
      });
      set(this, 'harborImageTags', []);
      set(this, 'imageTag', null);

      return;
    }
    const harborRepo = get(this, 'harborRepo');

    if (input.startsWith(`${ harborRepo }/`)) {
      input = input.replace(`${ harborRepo }/`, '')
    }
    input = input.indexOf(':') > -1 ? input.substr(0, input.indexOf(':')) : input;

    return get(this, 'harbor').fetchProjectsAndImages(input).then((resp) => {
      const repos = resp.body.repository;
      const repo = get(this, 'harborRepo');
      const urls = repos.map((r) => {
        return `${ repo }/${ r.repository_name }`;
      });

      set(this, 'harborImages', {
        raw:  repos,
        urls,
      });
      this.loadHarborImageVersions();
    });
  },
  loadHarborServerUrl() {
    get(this, 'harbor').loadHarborServerUrl().then((resp) => {
      set(this, 'harborServer', resp);
    });
  },
  loadHarborImageVersions() {
    const input = get(this, 'userInput');
    const harborRepo = get(this, 'harborRepo');

    if (!input.startsWith(harborRepo)) {
      set(this, 'harborImageTags', []);

      return;
    }
    const image = input.indexOf(':') > -1 ? input.substr(0, input.indexOf(':')) : input;
    const repo = get(this, 'harborImages').raw.find((item) => {
      return image === `${ harborRepo }/${ item.repository_name }`;
    });

    if (!repo) {
      set(this, 'harborImageTags', []);

      return;
    }
    get(this, 'harbor').fetchTags(repo.project_id, repo.repository_name).then((resp) => {
      const tags = resp.body;
      const input = get(this, 'userInput');
      const imageTag = input.indexOf(':') > -1 ? input.substr(input.indexOf(':') + 1) : null;
      const tag = tags.find((t) => t.name === imageTag);

      set(this, 'imageTag', tag && tag.name);
      set(this, 'harborImageTags', resp.body);
    });
  },
});

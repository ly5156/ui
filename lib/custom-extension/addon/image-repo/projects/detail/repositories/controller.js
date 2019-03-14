import Controller from '@ember/controller';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';

export default Controller.extend({
  harbor:                 service(),
  queryParams:            ['page', 'name'],
  page:                   1,
  searchText:             '',
  showConfirmDeleteModal: false,
  selectedImage:          [],
  headers:                [
    {
      name:           'name',
      label:          '名称',
    },
    {
      name:            'repo_name',
      label:           '标签数',
    },
    {
      name:           'pull_count',
      label:           '下载数',
    },
  ],
  availableActions: [
    {
      action:   'remove',
      icon:     'icon icon-trash',
      label:    'action.remove',
    },
  ],
  actions:     {
    pageChange(page) {
      this.transitionToRoute({ queryParams: { page } });
    },
    search(val) {
      this.transitionToRoute({ queryParams: { name: val } });
    },
    promptDelete(projects) {
      set(this, 'showConfirmDeleteModal', true)
      set(this, 'selectedImage', projects);
    },
    confirmDelete() {
      const images = get(this, 'selectedImage');

      if (images && images.length > 0) {
        get(this, 'harbor').deleteMirror(images.map((p) => p.name)).then(() => {
          set(this, 'selectedImage', null);
          set(this, 'showConfirmDeleteModal', false);
          this.send('refreshModel');
        }).catch((err) => {
          set(this, 'selectedImage', null);
          set(this, 'showConfirmDeleteModal', false);
          this.send('refreshModel');
          this.growl.fromError('删除失败', err.body)
        });
      }
    }
  }
});
import { fetchPhotos, setupPagination, checkPaginationButtons } from './photoGallery.js';
import { setupModal } from './modalManager.js';
import { fetchTags } from './tagManager.js';

window.onload = () => {
  fetchPhotos();
  setupPagination();
  setupModal();
  fetchTags();
  checkPaginationButtons();
};
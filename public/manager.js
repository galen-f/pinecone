import { fetchPhotos, setupPagination, checkPaginationButtons } from './photoGallery.js';
import { setupModal } from './modalManager.js';

window.onload = () => {
  fetchPhotos();
  setupPagination();
  setupModal();
  checkPaginationButtons();
};
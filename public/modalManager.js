import { state } from './state.js';

export function openModal(photo) {
  console.log('Photo ID:', photo.id);
  const modal = document.getElementById('modal');
  const modalImg = modal.querySelector('img');
  const downloadButton = modal.querySelector('.download-button');
  const tagsDiv = modal.querySelector('#photo-tags');

  state.currentPhotoId = photo.id;

  modalImg.onload = () => {};

  const safePath = photo.location.replace(/\\/g, '/');
  modalImg.src = `http://localhost:5000/media/${encodeURIComponent(safePath)}`;
  downloadButton.href = modalImg.src;
  downloadButton.download = photo.file_name;

  modal.style.display = 'flex';
}

export function setupModal() {
  const modal = document.getElementById('modal');

  modal.addEventListener('click', e => {
    if (e.target.classList.contains('close-button') || e.target === modal) {
      modal.style.display = 'none';
    }
  });

  const nestedModal = document.getElementById('nestedModal');
  if (nestedModal) {
    $('#nestedModal').on('show.bs.modal', function () {
      fetchNestedTags();
    });
  }
}
import { currentPhotoId, currentPhotoTags } from './state.js';
import { fetchNestedTags } from './tagManager.js';

export function openModal(photo) {
  console.log('Photo ID:', photo.id);
  const modal = document.getElementById('modal');
  const modalImg = modal.querySelector('img');
  const downloadButton = modal.querySelector('.download-button');
  const tagsDiv = modal.querySelector('#photo-tags');

  currentPhotoTags.length = 0;
  currentPhotoId = photo.id;

  modalImg.onload = () => {};

  const safePath = photo.location.replace(/\\/g, '/');
  modalImg.src = `../media/${safePath}`;
  downloadButton.href = modalImg.src;
  downloadButton.download = photo.file_name;

  fetch(`http://localhost:5000/photos/${photo.id}/tags`)
    .then(response => response.json())
    .then(tags => {
      tagsDiv.innerHTML = '';
      currentPhotoTags.length = 0;

      if (tags.length >= 0) {
        const formattedTags = 'Tags: ' + tags.map(tag => {
          currentPhotoTags.push(tag.tag_name);
          return tag.tag_name;
        }).join(', ');

        tagsDiv.textContent = formattedTags;
      }
    })
    .catch(error => console.error('Error fetching tags for modal:', error));

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
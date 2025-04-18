import { openModal } from './modalManager.js';
import { state } from './state.js';

export function fetchPhotos(search = '') {
  const { currentPage, itemsPerPage, selectedTags } = state;
  const container = document.getElementById('photos');
  container.innerHTML = '<p>Loading...</p>';

  fetch(`http://localhost:5000/photos?page=${currentPage}&limit=${itemsPerPage}&search=${search}&tags=${selectedTags.join(',')}`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = '';
      if (data.length === 0) {
        container.innerHTML = '<h3>No files found.</h3>';
        return;
      }
      data.forEach(photo => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('photo-wrapper');

        const a = document.createElement('a');
        a.addEventListener('click', e => {
          e.preventDefault();
          openModal(photo);
        });

        const loc = encodeURIComponent(photo.location);

        // full‑res media
        if (photo.file_type === 'video') {
          const video = document.createElement('video');
          // full‑res
          video.src    = `http://localhost:5000/media/${loc}`;
          // thumbnail
          video.poster = `http://localhost:5000/thumbnail/${loc}`;
          a.appendChild(video);
        } else {
          const img = document.createElement('img');
          // serve thumbnail via HTTP, not file://
          img.src = `http://localhost:5000/thumbnail/${loc}`;
          a.appendChild(img);
        }

        wrapper.appendChild(a);
        container.appendChild(wrapper);
      });
      checkPaginationButtons();
    });
}

export function setupPagination() {
  document.getElementById('prev-page').addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      fetchPhotos();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    currentPage++;
    fetchPhotos();
  });

  document.getElementById('search-bar').addEventListener('input', e => {
    currentPage = 1;
    fetchPhotos(e.target.value);
  });
}

export function checkPaginationButtons() {
  document.getElementById('prev-page').disabled = state.currentPage === 1;
}
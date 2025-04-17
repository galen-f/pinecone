import { fetchPhotos } from './photoGallery.js';
import { selectedTags, currentPhotoTags, currentPhotoId } from './state.js';

export function fetchTags() {
  fetch('http://localhost:5000/tags')
    .then(response => response.json())
    .then(data => {
      const filtersDiv = document.getElementById('filters');
      filtersDiv.innerHTML = '';

      data.forEach(tag => {
        const button = document.createElement('button');
        button.classList.add('filter-button');
        button.innerText = tag;

        button.addEventListener('click', () => {
          button.classList.toggle('selected');
          if (button.classList.contains('selected')) {
            selectedTags.push(tag);
          } else {
            const index = selectedTags.indexOf(tag);
            if (index > -1) selectedTags.splice(index, 1);
          }

          fetchPhotos(document.getElementById('search-bar').value);

          if (button.classList.contains('selected')) {
            filtersDiv.prepend(button);
          } else {
            filtersDiv.appendChild(button);
          }
        });

        filtersDiv.appendChild(button);
      });
    })
    .catch(error => console.error('Error fetching tags:', error));
}

export function fetchNestedTags() {
  fetch('http://localhost:5000/tags')
    .then(response => response.json())
    .then(allTags => {
      const nestedModalContentDiv = document.getElementById('nestedModalContent');
      nestedModalContentDiv.innerHTML = '';

      allTags.forEach(tag => {
        const button = document.createElement('button');
        button.classList.add('filter-button');
        button.innerText = tag;

        if (currentPhotoTags.includes(tag)) {
          button.classList.add('selected');
        }

        button.addEventListener('click', () => {
          button.classList.toggle('selected');

          if (button.classList.contains('selected')) {
            fetch(`http://localhost:5000/photos/${currentPhotoId}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tag_name: tag })
            })
              .then(response => {
                if (!response.ok) throw new Error('Failed to add tag');
                return response.json();
              })
              .then(json => console.log(json.message))
              .catch(error => console.error(error));
          } else {
            fetch(`http://localhost:5000/photos/${currentPhotoId}/tags/${tag}`, {
              method: 'DELETE'
            })
              .then(response => {
                if (!response.ok) throw new Error('Failed to remove tag');
                return response.json();
              })
              .then(json => console.log(json.message))
              .catch(error => console.error(error));

            const index = selectedTags.indexOf(tag);
            if (index > -1) selectedTags.splice(index, 1);
          }

          if (button.classList.contains('selected')) {
            nestedModalContentDiv.prepend(button);
          } else {
            nestedModalContentDiv.appendChild(button);
          }
        });

        if (button.classList.contains('selected')) {
          nestedModalContentDiv.prepend(button);
        } else {
          nestedModalContentDiv.appendChild(button);
        }
      });
    })
    .catch(error => console.error('Error fetching nested tags:', error));
}
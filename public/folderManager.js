import { fetchPhotos } from './photoGallery.js';

document.getElementById('folderPickerButton').addEventListener('click', async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      console.log('Selected folder:', folderPath);
      selectedFolderPath = folderPath;
  
      // send it to the backend to scan and process
      fetch('http://localhost:5000/set-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      })
      .then(res => res.json())
      .then(() => {
        fetchPhotos();
      })
    }
  });
  let selectedFolderPath = null;

  // Function returns the selected path so the system can display it
  function getSelectedFolderPath() {
    return selectedFolderPath;
  }
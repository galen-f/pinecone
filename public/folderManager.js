document.getElementById('folderPickerButton').addEventListener('click', async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      console.log('Selected folder:', folderPath);
  
      // send it to the backend to scan and process
      fetch('http://localhost:5000/set-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath })
      });
    }
  });
  
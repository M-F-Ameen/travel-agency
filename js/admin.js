document.addEventListener('DOMContentLoaded', function() {
    const addForm = document.getElementById('addForm');
    const itemsTableBody = document.querySelector('#itemsTable tbody');

    addForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        const imageFile = document.getElementById('image').files[0];

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageSrc = e.target.result;
                addItemToTable(title, description, price, imageSrc);
                addForm.reset();
            };
            reader.readAsDataURL(imageFile);
        } else {
            alert('Please select an image.');
        }
    });

    function addItemToTable(title, description, price, imageSrc) {
        const row = itemsTableBody.insertRow();

        const titleCell = row.insertCell(0);
        titleCell.textContent = title;

        const descCell = row.insertCell(1);
        descCell.textContent = description;

        const priceCell = row.insertCell(2);
        priceCell.textContent = '$' + parseFloat(price).toFixed(2);

        const imageCell = row.insertCell(3);
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = title;
        imageCell.appendChild(img);
    }
});


    mapboxgl.accessToken = mapToken;


    const map = new mapboxgl.Map({
        container: 'map', // container ID
        center: listing.geometry.coordinates, // starting position [lng, lat]
        zoom: 9 // starting zoom
    });


    const marker = new mapboxgl.Marker({ color: "black" })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(new mapboxgl.Popup({offset:20})
    .setHTML(
        `<h4>${listing.title}</4><p>${listing.location}</p>`
    )
    )
    .addTo(map);

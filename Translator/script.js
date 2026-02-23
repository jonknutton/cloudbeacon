

//translate button event script
document.querySelector('#translateBtn').addEventListener('click', function() {
    const input = document.getElementById('searchBox').value.toLowerCase();
    const words = input.split(' ');
    
    const translated = words.map(function(word) {
        return dictionary[word] || word;
    });
    
    document.getElementById('result').innerHTML = '<p>' + translated.join(' ') + '</p>';
})

//reverse translate button event script
document.querySelector('#reverseBtn').addEventListener('click', function() {
    const input = document.getElementById('searchBox').value.toLowerCase();
    const words = input.split(' ');
    
    const translated = words.map(function(word) {
        const found = Object.keys(dictionary).find(function(key) {
            return dictionary[key] === word;
        });
        return found || word;
    });
    
    document.getElementById('result').innerHTML = '<p>' + translated.join(' ') + '</p>';
})
const app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!',
        count: 0
    },
    methods: {
        showAlert() {
            alert('Button clicked!');
        },
        increment() {
            this.count += 1;
        }
    }
});

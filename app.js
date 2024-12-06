const app = new Vue({
    el: '#app',
    data: {
        sitename: 'After School Activities',
        currentPage: 'browse',
        lessons: [], // Lessons fetched from the backend
        cart: [],
        searchQuery: '', // For searching lessons
        sortAttribute: 'subject',
        sortOrder: 'asc',
        order: {
            name: '',
            phone: ''
        }
    },
    created() {
        // Fetch lessons from the backend
        fetch('https://after-school-backend-806q.onrender.com/lessons')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Map `_id` to `id` for compatibility with frontend
                this.lessons = Array.isArray(data)
                    ? data.map(lesson => ({
                        ...lesson,
                        id: lesson._id, // Copy `_id` to `id`
                    }))
                    : [];
                console.log('Mapped lessons:', this.lessons); // Debugging
            })
            .catch(error => {
                console.error('Error fetching lessons:', error);
                this.lessons = []; // Default to an empty array if fetch fails
            });
    },
    
    methods: {
        enrollNow(lesson) {
            console.log('Lesson before enrolling:', lesson); // Debugging lesson object
            if (lesson.spaces > 0) {
                lesson.spaces -= 1; // Decrease available spaces
                let cartItem = this.cart.find(item => item.id === lesson.id); // Match based on `id`
                if (cartItem) {
                    cartItem.enrolled += 1; // Increment enrolled count for the existing item
                } else {
                    // Add a new lesson to the cart with `enrolled` property
                    this.cart.push({ ...lesson, enrolled: 1 });
                }
                console.log('Cart after enrolling:', this.cart); // Debugging cart contents
            } else {
                alert('No spaces left for this lesson!');
            }
        },
        
        submitForm() {
            const orderData = {
                name: this.order.name,
                phone: this.order.phone,
                lessonIDs: this.cart.map(item => item.id), // Extract lesson IDs only
                spaces: this.cart.reduce((total, item) => total + item.enrolled, 0), // Total spaces to decrement
            };
            
            
        
            console.log('Submitting order:', orderData); // Debugging order data
        
            // Submit the order to the backend
            fetch('https://after-school-backend-806q.onrender.com/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData), // Convert orderData to JSON
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Order submitted successfully:', data);
        
                    this.cart.forEach(item => {
                        fetch(`https://after-school-backend-806q.onrender.com/lessons/${item.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ spaces: item.spaces }), // Only include `spaces`
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error! Status: ${response.status}`);
                                }
                                return response.json();
                            })
                            .then(updateData => {
                                console.log(`Lesson ${item.id} updated successfully:`, updateData);
                            })
                            .catch(error => {
                                console.error(`Error updating lesson ${item.id}:`, error);
                            });
                    });
                    

// Clear the cart and reset the form
alert('Order Submitted! Thank you for enrolling.');
this.cart = []; // Clear the cart
this.order = { name: '', phone: '' }; // Reset the form fields
this.currentPage = 'browse'; // Navigate back to the browse page

                })
                .catch(error => {
                    console.error('Error submitting order:', error);
                    alert('Failed to submit order. Please try again.');
                });
        },
        
        sortLessons() {
            const attribute = this.sortAttribute;
            const order = this.sortOrder;

            this.lessons.sort((a, b) => {
                if (a[attribute] < b[attribute]) return order === 'asc' ? -1 : 1;
                if (a[attribute] > b[attribute]) return order === 'asc' ? 1 : -1;
                return 0;
            });
        },
        toggleSortOrder() {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            this.sortLessons(); // Re-sort lessons after toggling order
        },
        removeFromCart(item) {
            this.cart = this.cart.filter(cartItem => cartItem.id !== item.id);
            const lesson = this.lessons.find(lessonItem => lessonItem.id === item.id);
            if (lesson) {
                lesson.spaces += item.enrolled;
            }
        }
    },
    computed: {
        filteredLessons() {
            const query = this.searchQuery.toLowerCase();

            // Add defensive checks for undefined properties
            return this.lessons.filter(lesson => {
                const subject = lesson.subject ? lesson.subject.toLowerCase() : '';
                const location = lesson.location ? lesson.location.toLowerCase() : '';
                const price = lesson.price ? lesson.price.toString() : '';
                const spaces = lesson.spaces ? lesson.spaces.toString() : '';

                return (
                    subject.includes(query) || 
                    location.includes(query) || 
                    price.includes(query) || 
                    spaces.includes(query)
                );
            });
        },
        cartCount() {
            return this.cart.reduce((sum, item) => sum + item.enrolled, 0);
        },
        isNameValid() {
            return /^[A-Za-z\s]+$/.test(this.order.name);
        },
        isPhoneValid() {
            return /^[0-9]+$/.test(this.order.phone);
        },
        isFormValid() {
            return this.isNameValid && this.isPhoneValid && this.order.name && this.order.phone;
        }
    }
});

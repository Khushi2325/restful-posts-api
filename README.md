# PathlyLab Posts

PathlyLab Posts is a backend application that provides a structured way to create, read, update, and delete posts.  
The project focuses on implementing REST principles, proper routing, and database operations in a clean and organized manner.

---

## Tech Stack

- Node.js  
- Express.js  
- MongoDB  
- Mongoose  

---

## Features

- Create a new post  
- Retrieve all posts  
- Retrieve a single post by ID  
- Update an existing post  
- Delete a post  
- RESTful routing structure  

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Khushi2325/pathlylab-posts.git
```

### 2. Navigate into the project folder

```bash
cd pathlylab-posts
```

### 3. Install dependencies

```bash
npm install
```

### 4. Make sure MongoDB is running locally

### 5. Run the server

```bash
nodemon index.js
```

### 6. Open in browser or test using Postman

```
http://localhost:8080/posts
```

---

## API Endpoints

| Method | Route        | Description              |
|--------|-------------|--------------------------|
| GET    | /posts      | Get all posts            |
| GET    | /posts/:id  | Get a single post        |
| POST   | /posts      | Create a new post        |
| PUT    | /posts/:id  | Update an existing post  |
| DELETE | /posts/:id  | Delete a post            |

---

## Example Request Body

```json
{
  "title": "Sample Post",
  "content": "This is a sample post content."
}
```

---

## Author

Khushi

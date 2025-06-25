Here is the `README.md` file for your project, provided again for your convenience.

-----

# Data Compression Portal

A web application for compressing and decompressing various file types using different algorithms, providing insights into compression efficiency.

## Table of Contents

  * [About the Project](https://www.google.com/search?q=%23about-the-project)
  * [Features](https://www.google.com/search?q=%23features)
  * [Technologies Used](https://www.google.com/search?q=%23technologies-used)
  * [Getting Started](https://www.google.com/search?q=%23getting-started)
      * [Prerequisites](https://www.google.com/search?q=%23prerequisites)
      * [Installation](https://www.google.com/search?q=%23installation)
  * [Running the Application](https://www.google.com/search?q=%23running-the-application)
  * [Usage](https://www.google.com/search?q=%23usage)
  * [Project Structure](https://www.google.com/search?q=%23project-structure)
  * [Deployment](https://www.google.com/search?q=%23deployment)
      * [Frontend Deployment (Vercel / Netlify)](https://www.google.com/search?q=%23frontend-deployment-vercel--netlify)
      * [Backend Deployment (Render / Heroku / Railway)](https://www.google.com/search?q=%23backend-deployment-render--heroku--railway)
  * [Contributing](https://www.google.com/search?q=%23contributing)
  * [License](https://www.google.com/search?q=%23license)
  * [Contact](https://www.google.com/search?q=%23contact)

-----

## About the Project

The Data Compression Portal is a full-stack web application designed to demonstrate and apply data compression techniques. Users can upload various file types (text, JSON, images like BMP, PNG, JPG), compress them using selected algorithms (e.g., Huffman, RLE), view compression statistics, and then decompress the files back to their original format.

## Features

  * **File Upload:** Securely upload files for compression.
  * **Multiple Compression Algorithms:**
      * **Huffman Coding:** Ideal for text-based files due to its variable-length coding based on character frequency.
      * **Run-Length Encoding (RLE):** Effective for data with consecutive repeated characters, common in certain image formats.
  * **Compression Statistics:** View original size, compressed size, compression ratio, and processing time.
  * **Download Compressed Files:** Download the compressed output (as a `.json` file containing the compressed data).
  * **Decompression:** Restore compressed files to their original form and download them.
  * **File Type Preservation:** Decompressed files retain their original file type (e.g., a compressed `.png` decompresses back to a `.png`).
  * **Intuitive User Interface:** A clean and responsive design built with React.

## Technologies Used

  * **Frontend:**
      * React.js
      * Tailwind CSS (for styling)
      * Lucide React (for icons)
      * `react-scripts` (for project setup and build)
  * **Backend:**
      * Node.js
      * Express.js
      * `multer` (for handling file uploads)
      * `cors` (for Cross-Origin Resource Sharing)
      * Custom implementations of Huffman Coding and Run-Length Encoding algorithms.
  * **Development Tools:**
      * Nodemon (for automatic backend restarts during development)
      * Git / GitHub (for version control)

-----

## Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

  * Node.js (LTS version recommended)
  * npm (comes with Node.js) or Yarn
  * Git

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/priyanshuk001/Compression_Decompression_Portal.git
    cd Compression_Decompression_Portal
    ```

2.  **Install Frontend Dependencies:**

    ```bash
    cd frontend
    npm install # or yarn install
    ```

3.  **Install Backend Dependencies:**

    ```bash
    cd ../backend
    npm install # or yarn install
    ```

-----

## Running the Application

You need to start both the backend and frontend servers.

1.  **Start the Backend Server:**
    Navigate to the `backend` directory in your terminal:

    ```bash
    cd backend
    npm start # or yarn start
    ```

    The backend server will typically run on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    Open a **new terminal window**. Navigate to the `frontend` directory:

    ```bash
    cd frontend
    npm start # or yarn start
    ```

    The React development server will typically open in your browser at `http://localhost:3000`.

-----

## Usage

1.  **Upload a File:**
      * Click on the "Click to upload or drag and drop" area in the "File Upload" section.
      * Select a file (e.g., `.txt`, `.json`, `.bmp`, `.png`, `.jpg`). File details will appear.
2.  **Select Algorithm:**
      * Choose between "Huffman Coding" or "Run-Length Encoding" from the "Algorithm" section. Read the "Algorithm Info" for details on each.
3.  **Compress File:**
      * Click the "Compress File" button in the "Actions" section.
      * Once complete, "Statistics" will appear showing original size, compressed size, and compression ratio. A "Download Compressed (.json)" button will also appear.
4.  **Decompress File:**
      * Click the "Decompress File" button.
      * Once complete, a "Download Decompressed" button will appear. Clicking this will download the file in its original format and name.

-----

## Project Structure

```
Compression_Decompression_Portal/
├── frontend/                 # React frontend application
│   ├── public/               # Public assets
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable React components
│   │   └── App.js            # Main application component
│   ├── package.json          # Frontend dependencies and scripts
│   └── ...
├── backend/                  # Node.js Express backend API
│   ├── algorithms/           # Custom compression algorithm implementations
│   │   ├── huffman.js
│   │   └── rle.js
│   ├── uploads/              # Temporary directory for file uploads (ignored by Git)
│   ├── server.js             # Main backend server file
│   ├── package.json          # Backend dependencies and scripts
│   └── ...
├── .gitignore                # Specifies intentionally untracked files to ignore
├── README.md                 # This file
└── ...
```

-----

## Deployment

This project is set up for separate deployment of the frontend and backend.

### Frontend Deployment (Vercel / Netlify)

1.  **Build your React app:**
    ```bash
    cd frontend
    npm run build # or yarn build
    ```
    This creates a `build` folder.
2.  **Create a GitHub repository** for your entire project (if you haven't already).
3.  **Connect Vercel/Netlify to your GitHub repository.**
4.  **Configure build settings:**
      * **Root Directory:** `frontend/`
      * **Build Command:** `npm run build`
      * **Output Directory:** `build`
      * **Environment Variable:** Set `REACT_APP_API_URL` to the URL of your deployed backend (e.g., `https://your-backend-app.onrender.com`).

### Backend Deployment (Render / Heroku / Railway)

1.  **Ensure `server.js` uses `process.env.PORT`:**
    ```javascript
    const port = process.env.PORT || 3001;
    // ...
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    ```
2.  **Configure CORS in your backend (`server.js`):**
    ```javascript
    const cors = require('cors');
    app.use(cors({
        origin: process.env.FRONTEND_URL, // Set this env var on your hosting platform
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    ```
3.  **Create a GitHub repository** for your entire project (if you haven't already).
4.  **Connect Render/Heroku/Railway to your GitHub repository.**
5.  **Configure service settings:**
      * **Root Directory:** `backend/`
      * **Runtime:** Node.js
      * **Build Command:** `npm install`
      * **Start Command:** `npm start`
      * **Environment Variables:**
          * `PORT` (usually set automatically by the platform, but ensure your code uses it)
          * `FRONTEND_URL`: Set this to the URL of your deployed frontend (e.g., `https://your-frontend-app.vercel.app`).

-----

## Contributing

Contributions are welcome\! Please feel free to fork the repository, create a new branch, make your changes, and submit a pull request.

-----

## License

This project is open-source and available under the [MIT License](LICENSE.md). (You'll need to create a `LICENSE.md` file in your root directory if you choose this license).

-----

## Contact

Priyanshu - [your-email@example.com](mailto:your-email@example.com)

Project Link: [https://github.com/priyanshuk001/Compression\_Decompression\_Portal](https://www.google.com/search?q=https://github.com/priyanshuk001/Compression_Decompression_Portal)

-----

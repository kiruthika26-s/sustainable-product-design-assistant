import "./App.css";

function App() {
  return (
    <div className="container">
      <h1>Sustainable Product Lifecycle Management Platform</h1>

      <div className="card">
        <h2>Product Details</h2>

        <input
          type="text"
          placeholder="Product Name"
        />

        <input
          type="text"
          placeholder="Material"
        />

        <input
          type="number"
          placeholder="Weight (kg)"
        />

        <select>
          <option>Plastic</option>
          <option>Paper</option>
          <option>Glass</option>
          <option>Metal</option>
        </select>

        <button>Calculate Recyclability Score</button>

        <h3>Recyclability Score: 85%</h3>
      </div>
    </div>
  );
}

export default App;
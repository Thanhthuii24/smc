import React from "react";

const ProductSuggest = () => {
  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Product Suggestions</h2>
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Product 1</h5>
              <p className="card-text">Description of product 1.</p>
              <a href="#" className="btn btn-primary">
                View Details
              </a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Product 2</h5>
              <p className="card-text">Description of product 2.</p>
              <a href="#" className="btn btn-primary">
                View Details
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggest;

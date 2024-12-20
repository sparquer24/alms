import policeBadge from '../assets/ps_logo.png'; // Assume you have a police badge image in your assets folder

const NotFound = () => {
    return (
        <div className="not-found-container">
            <div className="police-theme">
                <img src={policeBadge} alt="Police Badge" className="police-badge" />
                <h1>404 - Page Not Found</h1>
                <p>We couldn't find the page you're looking for.</p>
                {/* <p>This area is restricted, please return to a safe zone.</p> */}
                <a href="/" className="back-home-btn">Home</a>
            </div>
        </div>
    );
};

export default NotFound;

import { useState } from "react";
import { createPortal } from "react-dom";

export default function TestPage() {
    const [showMenu, setShowMenu] = useState(false);
    const shareUrl = window.location.href;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert("✅ Link copied to clipboard!");
        setShowMenu(false);
    };

    return (
        <>
            <button onClick={() => setShowMenu(!showMenu)}>Share</button>

            {showMenu &&
                createPortal(
                    <div
                        style={{
                            position: "fixed",
                            top: "100px",
                            right: "50px",
                            background: "white",
                            border: "1px solid #ccc",
                            borderRadius: "5px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                            zIndex: 999999,
                            display: "flex",
                            flexDirection: "column",
                            minWidth: "180px",
                        }}
                    >
                        <button
                            style={menuButtonStyle}
                            onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")}
                        >
                            📘 Facebook
                        </button>
                        <button
                            style={menuButtonStyle}
                            onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Check this out!`, "_blank")}
                        >
                            🐦 Twitter
                        </button>
                        <button
                            style={menuButtonStyle}
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Check this out! " + shareUrl)}`, "_blank")}
                        >
                            📱 WhatsApp
                        </button>
                        <button
                            style={menuButtonStyle}
                            onClick={handleCopyLink}
                        >
                            🔗 Copy Link
                        </button>
                    </div>,
                    document.body
                )
            }
        </>
    );
}

// Button styling
const menuButtonStyle = {
    background: "none",
    border: "none",
    padding: "10px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s ease",
};

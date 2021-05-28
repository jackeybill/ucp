import React from 'react';
import './index.scss';



const Footer = () => {
    return (
        <div className="footer">
            <div className="left">
                © 2021 PwC. All rights reserved
            </div>
            <div className="right">
                <span>Full legal</span>
                <span>Privacy policy</span>
                <span>Data usage policy</span>
                <span>Terms of use</span>
            </div>
        </div>
    )
}

export default Footer
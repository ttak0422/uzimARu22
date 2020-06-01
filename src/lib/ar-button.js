// TODO
// [ ] support onEndsession
// [ ] refactor style

const Status = {
    Initializing:1,
    Ready: 2,
    Running: 3,
    NotSupported: 4,
}

const DefaultOptions = {
    buttonStyle : "width: 50%; height: 10%; position: absolute; left: 25%; bottom: 5%;",
    textStyle : "font-size: 5em;",
    buttonText : "Tap to Start",
    onRequestSession: (() => console.log("onRequestSesssion")),
    onEndSession: (() => console.log("onEndSession")),
}

class ARButton extends HTMLElement {
    constructor(opt) {
        super();
        const shadowDOM = this.attachShadow({mode:"open"})
        const options = opt || {};
        const buttonStyle = options.buttonStyle || DefaultOptions.buttonStyle;
        const textStyle = options.buttonStyle || DefaultOptions.textStyle;
        const buttonText = options.buttonText || DefaultOptions.buttonText;
        const onRequestSession = options.onRequestSession || DefaultOptions.onRequestSession;
        const onEndSession = options.onRequestSession || DefaultOptions.onEndSession;
        this._status = Status.Initializing;
        this._buttonElem = document.createElement("button");
        this._buttonElem.textContent = buttonText;
        this._textElem = document.createElement("text");
        this._buttonElem.appendChild(this._textElem);
        this._buttonElem.onclick = () => {
            onRequestSession();
            this.status = Status.Running;
            this.updateView();
        }
        shadowDOM.appendChild(this._buttonElem);
        if(buttonStyle.trim() !== "") {
            this._buttonElem.setAttribute("style", buttonStyle);
        }
        if(textStyle.trim() !== "") {
            this._textElem.setAttribute("style", textStyle);
        }
        this.checkStatus();
    }

    checkStatus() {
        if("xr" in navigator) {
            navigator.xr.isSessionSupported("immersive-ar")
                .then((supported)=> {
                    if(supported) {
                        this.status = Status.Ready;
                        console.log("supported");
                        this.updateView();
                    } else {
                        this.status = Status.NotSupported;
                        console.log("not supported");
                        this.updateView();
                    }
                });
        } else {
            this.status = Status.NotSupported;
            console.log("not supported");
            this.updateView();
        }
    }

    updateView() {
        switch(this.status) {
            case Status.Initializing:
                this._buttonElem.setAttribute("disabled", "true");
                break;
            case Status.Ready:
                this._buttonElem.removeAttribute("disabled");
                break;
            case Status.Running:
                // 
                break;
            case Status.NotSupported:
                this._buttonElem.setAttribute("disabled", "true");
                break;
        }
    }
}

export { ARButton }
customElements.define("ar-button", ARButton);
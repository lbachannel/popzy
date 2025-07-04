function Popzy(options = {}) {
    this.opt = Object.assign({
        destroyOnClose: true,
        closeMethods: ['button', 'overlay', 'escape'],
        cssClass: [],
        footer: false,
    }, options);

    this.template = document.querySelector(`#${this.opt.templateId}`);

    this._footerButtons = [];

    if (!this.template) {
        return console.log(`#${this.opt.templateId} does not exist`);
    }

    const { closeMethods } = this.opt;
    this._allowBackdropClose = closeMethods.includes('overlay');
    this._allowButtonClose = closeMethods.includes('button');
    this._allowEscapeClose = closeMethods.includes('escape');

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

Popzy.elements = [];

Popzy.prototype._createButton = function(title, cssClass, callback) {
    const button = document.createElement('button');
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;
    return button;
}

Popzy.prototype._renderFooterContent = function() {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
}

Popzy.prototype.setFooterContent = function(html) {
    this._footerContent = html;
    this._renderFooterContent();
}

Popzy.prototype._renderFooterButtons = function() {
    if (this._modalFooter) {
        this._footerButtons.forEach(button => {
            this._modalFooter.append(button);
        })
    }
}

Popzy.prototype.addFooterButton = function(title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButtons.push(button);
    this._renderFooterButtons();
}

Popzy.prototype._build = function() {
    const content = this.template.content.cloneNode(true);

    // create modal elements
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'popzy__backdrop';

    const container = document.createElement('div');
    container.className = 'popzy__container';

    this.opt.cssClass.forEach(className => {
        if (typeof className === 'string') {
            container.classList.add(className);
        }
    });

    // attack event listener
    if (this._allowButtonClose) {
        const buttonClose = this._createButton(
            '&times',
            'popzy__close',
            () => this.close()
        );
        container.append(buttonClose);
    }

    const modalContent = document.createElement('div');
    modalContent.classList = 'popzy__content';

    // append content and elements
    modalContent.append(content);
    container.append(modalContent);

    if (this.opt.footer) {
        this._modalFooter = document.createElement('div');
        this._modalFooter.className = 'popzy__footer';

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._modalFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);
};

Popzy.prototype._getScrollWidth = function() {
    if (this.scrollWidth) {
        return this._scrollWidth;
    }
    const div = document.createElement('div');
    Object.assign(div.style, {
        overflow: 'scroll',
        position: 'absolute',
        top: '-99px'
    });

    document.body.append(div);
    this._scrollWidth - div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);
    return this._scrollWidth;
};

Popzy.prototype._handleEscapeKey = function(e) {
    const lastModal = Popzy.elements[Popzy.elements.length - 1];
    if (e.key === 'Escape' && this === lastModal) {
        this.close();
    }
}

Popzy.prototype._onTransitionEnd = function(callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== 'transform') {
            return;
        }
    }

    if (typeof callback === 'function') {
        callback();
    }
}

Popzy.prototype.open = function() {
    Popzy.elements.push(this);
    if (!this._backdrop) {
        this._build();
    }

    setTimeout(() => {
        this._backdrop.classList.add('popzy--show');
    }, 0);

    // disable scrolling
    document.body.classList.add('popzy--no-scroll');
    document.body.style.paddingRight = this._getScrollWidth() + 'px';

    // attack event listener
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        }
    }

    if (this._allowEscapeClose) {
        document.addEventListener('keydown', this._handleEscapeKey);
    }

    this._onTransitionEnd(this.opt.onOpen());
    return this._backdrop;
}

Popzy.prototype.close = function(destroy = this.opt.destroyOnClose) {
    Popzy.elements.pop();
    this._backdrop.classList.remove('popzy--show');
    if (this._allowEscapeClose) {
        document.removeEventListener('keydown', this._handleEscapeKey);
    }

    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        };

        if (!Popzy.elements.length) {
            // enable scrolling
            document.body.classList.remove('popzy--no-scroll');
            document.body.style.paddingRight = "";
        }

        if (typeof this.opt.onClose === 'function') {
            this.opt.onClose();
        }
    })
}

Popzy.prototype.destroy = function() {
    this.close(true);
}
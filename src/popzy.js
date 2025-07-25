function Popzy(options = {}) {

    if (!options.content && !options.templateId) {
        return console.error(`You must provide one of 'content' or 'templateId'`);
    }

    if (options.content && options.templateId) {
        console.warn(`content will take precedence, and templateId will be ignored.`);
        options.templateId = null;
    }

    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);
        if (!this.template) {
            return console.error(`#${options.templateId} does not exist`);
        }
    } 

    this.opt = Object.assign({
        destroyOnClose: true,
        closeMethods: ['button', 'overlay', 'escape'],
        cssClass: [],
        footer: false,
        enableScrollLock: true,
        scrollLockTarget: () => document.body,
    }, options);

    this._footerButtons = [];

    this.content = this.opt.content;
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

Popzy.prototype.setFooterContent = function(content) {
    this._footerContent = content;
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
    const contentNode = this.content ? document.createElement('div') : this.template.content.cloneNode(true);

    if (this.content) {
        contentNode.innerHTML = this.content;
    }

    // create modal elements
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'popzy';

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
            '&times;',
            'popzy__close',
            () => this.close()
        );
        container.append(buttonClose);
    }

    this._modalContent = document.createElement('div');
    this._modalContent.classList = 'popzy__content';

    // append content and elements
    this._modalContent.append(contentNode);
    container.append(this._modalContent);

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
    if (this._scrollWidth) {
        return this._scrollWidth;
    }
    const div = document.createElement('div');
    Object.assign(div.style, {
        overflow: 'scroll',
        position: 'absolute',
        top: '-9999px'
    });

    document.body.append(div);
    this._scrollWidth = div.offsetWidth - div.clientWidth;
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
    if (Popzy.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();
        
        if (this._hasScrollBar(target)) {
            const targetPadRight = parseFloat(getComputedStyle(target).paddingRight);
            target.classList.add('popzy--no-scroll');
            target.style.paddingRight = targetPadRight + this._getScrollWidth() + 'px';
        }
    }

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

    this._onTransitionEnd(this.opt.onOpen);
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

        if (this.opt.enableScrollLock && !Popzy.elements.length) {
            // enable scrolling
            const target = this.opt.scrollLockTarget();
            if (this._hasScrollBar(target)) {
                target.classList.remove('popzy--no-scroll');
                target.style.paddingRight = "";
            }
        }

        if (typeof this.opt.onClose === 'function') {
            this.opt.onClose();
        }
    })
}

Popzy.prototype.destroy = function() {
    this.close(true);
}

Popzy.prototype.setContent = function(content) {
    this.content = content;
    if (this._modalContent) {
        this._modalContent.innerHTML = this.content;
    }
}

Popzy.prototype._hasScrollBar = (target) => {
    if ([document.documentElement, document.body].includes(target)) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight || document.body.scrollHeight > document.body.clientHeight;
    }
    return target.scrollHeight > target.clientHeight;
}
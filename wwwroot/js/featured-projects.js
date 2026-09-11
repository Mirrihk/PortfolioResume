const carousels = new WeakMap();

export function initialize(root, intervalMs = 6000) {
    dispose(root);

    const slides = [...root.querySelectorAll('[data-project]')];
    const indicators = [...root.querySelectorAll('[data-project-index]')];
    const viewport = root.querySelector('[data-viewport]');
    const rotation = root.querySelector('[data-rotation]');
    const rotationLabel = root.querySelector('[data-rotation-label]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const events = new AbortController();
    const on = (target, name, handler) => target.addEventListener(name, handler, { signal: events.signal });
    let index = Math.max(0, slides.findIndex(slide => slide.dataset.active === 'true'));
    let playing = !reducedMotion.matches;
    let hovering = root.matches(':hover');
    let timer;
    let animations = [];

    function schedule() {
        clearTimeout(timer);
        const rotating = playing && !hovering && !document.hidden && slides.length > 1;
        viewport.setAttribute('aria-live', rotating ? 'off' : 'polite');
        rotationLabel.textContent = playing ? 'Pause' : 'Play';
        rotation.setAttribute('aria-label', `${playing ? 'Pause' : 'Start'} automatic project rotation`);
        if (rotating) timer = setTimeout(() => show(index + 1, 1), intervalMs);
    }

    function show(nextIndex, direction) {
        const next = (nextIndex + slides.length) % slides.length;
        if (next !== index) {
            animations.forEach(animation => animation.cancel());
            const outgoing = slides[index];
            const incoming = slides[next];
            slides.forEach((slide, slideIndex) => {
                const active = slideIndex === next;
                slide.dataset.active = String(active);
                slide.setAttribute('aria-hidden', String(!active));
                slide.inert = !active;
            });
            indicators.forEach((button, buttonIndex) => {
                if (buttonIndex === next) button.setAttribute('aria-current', 'true');
                else button.removeAttribute('aria-current');
            });
            index = next;

            // Native animations give the tile a vertical wheel motion without a dependency.
            if (!reducedMotion.matches && incoming.animate) {
                const options = { duration: 550, easing: 'cubic-bezier(.22,.68,0,1)' };
                animations = [
                    outgoing.animate([
                        { transform: 'translateY(0) rotateX(0)', opacity: 1, visibility: 'visible' },
                        { transform: `translateY(${-direction * 35}%) rotateX(${direction * 8}deg)`, opacity: 0, visibility: 'visible' }
                    ], options),
                    incoming.animate([
                        { transform: `translateY(${direction * 35}%) rotateX(${-direction * 8}deg)`, opacity: 0 },
                        { transform: 'translateY(0) rotateX(0)', opacity: 1 }
                    ], options)
                ];
            }
        }
        schedule();
    }

    function select(next, direction) {
        // Manual browsing stays paused until the visitor explicitly presses Play.
        playing = false;
        show(next, direction);
    }

    on(root.querySelector('[data-previous]'), 'click', () => select(index - 1, -1));
    on(root.querySelector('[data-next]'), 'click', () => select(index + 1, 1));
    indicators.forEach((button, next) => on(button, 'click', () => select(next, next >= index ? 1 : -1)));
    on(rotation, 'click', () => {
        playing = !playing;
        schedule();
    });
    on(root, 'pointerenter', event => {
        if (event.pointerType === 'touch') return;
        hovering = true;
        schedule();
    });
    on(root, 'pointerleave', () => {
        hovering = false;
        schedule();
    });
    on(root, 'focusin', event => {
        // The rotation control must be focusable without changing the action about to be clicked.
        if (rotation.contains(event.target)) return;
        playing = false;
        schedule();
    });
    on(root, 'keydown', event => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1;
        const focusWasInSlide = slides[index].contains(document.activeElement);
        select(index + direction, direction);
        if (focusWasInSlide) slides[index].querySelector('a').focus();
    });
    on(document, 'visibilitychange', schedule);
    on(reducedMotion, 'change', () => {
        if (reducedMotion.matches) {
            playing = false;
            animations.forEach(animation => animation.cancel());
        }
        schedule();
    });

    carousels.set(root, () => {
        clearTimeout(timer);
        animations.forEach(animation => animation.cancel());
        events.abort();
    });
    schedule();
}

export function dispose(root) {
    carousels.get(root)?.();
    carousels.delete(root);
}

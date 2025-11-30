'use client';

import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const cardConfigs = [
  {
    name: 'Quiz AI',
    iconUrl: 'https://api.iconify.design/mdi/clipboard-text-outline.svg?color=%2362c857',
    width: 220,
    height: 120,
    background: '#e0f4dd',
    accent: '#62c857',
    iconBg: '#f3fce8',
  },
  {
    name: 'Presentazioni AI',
    iconUrl: 'https://api.iconify.design/mdi/presentation-play.svg?color=%239046ff',
    width: 360,
    height: 120,
    background: '#e9daff',
    accent: '#9046ff',
    iconBg: '#f2e6ff',
  },
  {
    name: 'Flashcard AI',
    iconUrl: 'https://api.iconify.design/mdi/cards-variant.svg?color=%23ffb73e',
    width: 320,
    height: 120,
    background: '#fff1d8',
    accent: '#ffb73e',
    iconBg: '#fff7e8',
  },
  {
    name: 'Lezioni AI',
    iconUrl: 'https://api.iconify.design/mdi/book-education-outline.svg?color=%23ff6325',
    width: 260,
    height: 120,
    background: '#ffdfd2',
    accent: '#ff6325',
    iconBg: '#ffece4',
  },
];

const PIXEL_RATIO = 2;
const CANVAS_HEIGHT = 320;

type SimulationRefs = {
  engine: Matter.Engine;
  runner: Matter.Runner;
  render: Matter.Render;
  mouseConstraint: Matter.MouseConstraint;
  cleanup?: () => void;
};

type CardAsset = {
  texture: string;
  width: number;
  height: number;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const buildCardTexture = (config: (typeof cardConfigs)[0], icon: HTMLImageElement): CardAsset => {
  const minWidth = config.width;
  const height = config.height;
  const iconBoxSize = 56;
  const iconRadius = 22;
  const iconBoxX = 28;
  const textPadding = 36;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { texture: '', width: minWidth, height };
  }

  ctx.font = 'bold 32px "Museo Sans Rounded", sans-serif';
  const textWidth = ctx.measureText(config.name).width;
  const textStart = iconBoxX + iconBoxSize + textPadding;
  const computedWidth = Math.max(minWidth, textStart + textWidth + 30);

  canvas.width = computedWidth * PIXEL_RATIO;
  canvas.height = height * PIXEL_RATIO;
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
  ctx.imageSmoothingEnabled = true;

  const w = computedWidth;
  const h = height;
  const radius = 30;

  ctx.fillStyle = config.background;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(w - radius, 0);
  ctx.quadraticCurveTo(w, 0, w, radius);
  ctx.lineTo(w, h - radius);
  ctx.quadraticCurveTo(w, h, w - radius, h);
  ctx.lineTo(radius, h);
  ctx.quadraticCurveTo(0, h, 0, h - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  const iconBoxY = h / 2 - iconBoxSize / 2;
  ctx.fillStyle = config.iconBg;
  ctx.beginPath();
  ctx.moveTo(iconBoxX + iconRadius, iconBoxY);
  ctx.lineTo(iconBoxX + iconBoxSize - iconRadius, iconBoxY);
  ctx.quadraticCurveTo(iconBoxX + iconBoxSize, iconBoxY, iconBoxX + iconBoxSize, iconBoxY + iconRadius);
  ctx.lineTo(iconBoxX + iconBoxSize, iconBoxY + iconBoxSize - iconRadius);
  ctx.quadraticCurveTo(
    iconBoxX + iconBoxSize,
    iconBoxY + iconBoxSize,
    iconBoxX + iconBoxSize - iconRadius,
    iconBoxY + iconBoxSize
  );
  ctx.lineTo(iconBoxX + iconRadius, iconBoxY + iconBoxSize);
  ctx.quadraticCurveTo(iconBoxX, iconBoxY + iconBoxSize, iconBoxX, iconBoxY + iconBoxSize - iconRadius);
  ctx.lineTo(iconBoxX, iconBoxY + iconRadius);
  ctx.quadraticCurveTo(iconBoxX, iconBoxY, iconBoxX + iconRadius, iconBoxY);
  ctx.closePath();
  ctx.fill();

  const iconWidth = iconBoxSize * 0.72;
  const iconHeight = iconBoxSize * 0.72;
  ctx.drawImage(
    icon,
    iconBoxX + iconBoxSize / 2 - iconWidth / 2,
    iconBoxY + iconBoxSize / 2 - iconHeight / 2,
    iconWidth,
    iconHeight
  );

  ctx.fillStyle = config.accent;
  ctx.font = 'bold 32px "Museo Sans Rounded", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.name, textStart, h / 2);

  return { texture: canvas.toDataURL('image/png'), width: w, height: h };
};

export default function PhysicsCards() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<SimulationRefs | null>(null);
  const hasInitializedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [simVersion, setSimVersion] = useState(0);

  const destroySimulation = () => {
    const sim = simulationRef.current;
    if (!sim) return;

    sim.cleanup?.();
    Matter.Render.stop(sim.render);
    Matter.Runner.stop(sim.runner);
    Matter.World.clear(sim.engine.world, false);
    Matter.Engine.clear(sim.engine);
    if (sim.mouseConstraint?.mouse) {
      Matter.Mouse.clearSourceEvents(sim.mouseConstraint.mouse);
    }
    const ctx = sim.render.canvas.getContext('2d');
    ctx?.clearRect(0, 0, sim.render.options.width ?? 0, sim.render.options.height ?? 0);
    simulationRef.current = null;
    hasInitializedRef.current = false;
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (hasInitializedRef.current) {
      return;
    }

    let cancelled = false;

    const initSimulation = async () => {
      if (!canvasRef.current || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const canvas = canvasRef.current;
      if (!simulationRef.current) {
        canvas.width = containerWidth * PIXEL_RATIO;
        canvas.height = CANVAS_HEIGHT * PIXEL_RATIO;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${CANVAS_HEIGHT}px`;
        
        // Clear canvas and ensure no stroke
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = 'transparent';
          ctx.lineWidth = 0;
        }
      }

      const assets = await Promise.all(
        cardConfigs.map(async (config) => {
          const icon = await loadImage(config.iconUrl);
          const textureData = buildCardTexture(config, icon);
          return { config, ...textureData };
        })
      );

      if (cancelled) return;
      destroySimulation();
      const engine = Matter.Engine.create();
      engine.gravity.y = 0.8;
      engine.gravity.scale = 0.001;

      const render = Matter.Render.create({
        canvas,
        engine,
        options: {
          width: containerWidth,
          height: CANVAS_HEIGHT,
          background: 'transparent',
          wireframes: false,
          pixelRatio: PIXEL_RATIO,
          showBounds: false,
          showDebug: false,
          showVelocity: false,
          showAngleIndicator: false,
          showIds: false,
          showSeparations: false,
          showCollisions: false,
        },
      });
      // Force remove all borders - override global CSS
      const canvasElement = render.canvas;
      canvasElement.style.setProperty('border', 'none', 'important');
      canvasElement.style.setProperty('border-top', 'none', 'important');
      canvasElement.style.setProperty('border-right', 'none', 'important');
      canvasElement.style.setProperty('border-bottom', 'none', 'important');
      canvasElement.style.setProperty('border-left', 'none', 'important');
      canvasElement.style.setProperty('outline', 'none', 'important');
      canvasElement.style.setProperty('background', 'transparent', 'important');
      
      // Ensure canvas context has no stroke
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 0;
        ctx.setLineDash([]);
      }
      
      Matter.Render.run(render);
      
      // After render starts, ensure no borders are drawn
      setTimeout(() => {
        const renderCtx = render.canvas.getContext('2d');
        if (renderCtx) {
          renderCtx.strokeStyle = 'transparent';
          renderCtx.lineWidth = 0;
        }
      }, 100);

      const runner = Matter.Runner.create();
      Matter.Runner.run(runner, engine);

      const wallThickness = 80;
      const walls = [
        Matter.Bodies.rectangle(containerWidth / 2, CANVAS_HEIGHT + wallThickness / 2, containerWidth, wallThickness, {
          isStatic: true,
          render: { visible: false },
        }),
        Matter.Bodies.rectangle(containerWidth / 2, -wallThickness / 2, containerWidth, wallThickness, {
          isStatic: true,
          render: { visible: false },
        }),
        Matter.Bodies.rectangle(-wallThickness / 2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT, { 
          isStatic: true,
          render: { visible: false },
        }),
        Matter.Bodies.rectangle(
          containerWidth + wallThickness / 2,
          CANVAS_HEIGHT / 2,
          wallThickness,
          CANVAS_HEIGHT,
          { 
            isStatic: true,
            render: { visible: false },
          }
        ),
      ];
      Matter.Composite.add(engine.world, walls);

      const dynamicBodies: Matter.Body[] = [];
      let activeBody: Matter.Body | null = null;
      const gap = 40;
      const totalWidth = assets.reduce((sum, asset) => sum + asset.width, 0);
      const totalGaps = gap * (assets.length - 1);
      let currentX = (containerWidth - (totalWidth + totalGaps)) / 2;

      assets.forEach(({ texture, width, height }, index) => {
        const centerX = currentX + width / 2;
        const y = CANVAS_HEIGHT * 0.3 + index * 15;

        const body = Matter.Bodies.rectangle(centerX, y, width, height, {
          chamfer: { radius: 28 },
          restitution: 0.55,
          friction: 0.35,
          frictionAir: 0.04,
          render: {
            sprite: {
              texture,
              xScale: 1 / PIXEL_RATIO,
              yScale: 1 / PIXEL_RATIO,
            },
          },
        });

        Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 1.4 });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.04);

        Matter.Composite.add(engine.world, body);
        dynamicBodies.push(body);
        currentX += width + gap;
      });

      const mouseElement = render.canvas;
      const mouse = Matter.Mouse.create(mouseElement);
      mouse.pixelRatio = PIXEL_RATIO;
      const mouseConstraint = Matter.MouseConstraint.create(engine, {
        mouse,
        constraint: {
          stiffness: 0.2,
          render: { visible: false },
        },
      });
      Matter.Composite.add(engine.world, mouseConstraint);
      const releaseActiveBody = () => {
        if (activeBody) {
          Matter.Body.setVelocity(activeBody, {
            x: activeBody.velocity.x * 0.3,
            y: Math.max(activeBody.velocity.y, 1.2),
          });
          Matter.Body.setAngularVelocity(activeBody, activeBody.angularVelocity * 0.4);
          activeBody = null;
        }
      };

      const clampMousePosition = () => {
        const clampedX = Math.min(Math.max(mouse.position.x, 0), containerWidth);
        const clampedY = Math.min(Math.max(mouse.position.y, 0), CANVAS_HEIGHT);
        mouse.position.x = clampedX;
        mouse.position.y = clampedY;
        if (mouse.positionPrev) {
          mouse.positionPrev.x = clampedX;
          mouse.positionPrev.y = clampedY;
        }
      };

      const releaseMouse = () => {
        if (mouseConstraint.constraint.body) {
          mouseConstraint.constraint.body = undefined;
          mouseConstraint.constraint.pointA = { x: 0, y: 0 };
        }
        mouse.button = -1;
        clampMousePosition();
        releaseActiveBody();
      };

      const startDragHandler = (event: Matter.IEvent<Matter.MouseConstraint>) => {
        const body = (event as any).body as Matter.Body | undefined;
        if (body) {
          activeBody = body;
        }
      };

      const endDragHandler = () => {
        releaseActiveBody();
      };

      Matter.Events.on(mouseConstraint, 'startdrag', startDragHandler);
      Matter.Events.on(mouseConstraint, 'enddrag', endDragHandler);

      const detachDomListeners: Array<() => void> = [];
      if (mouseElement) {
        mouseElement.removeEventListener('mousewheel', mouse.mousewheel as any);
        mouseElement.removeEventListener('DOMMouseScroll', mouse.mousewheel as any);
        const events: Array<[string, EventListener]> = [
          ['mouseleave', releaseMouse as EventListener],
          ['mouseup', releaseMouse as EventListener],
          ['mouseout', releaseMouse as EventListener],
          ['touchend', releaseMouse as EventListener],
          ['touchcancel', releaseMouse as EventListener],
        ];
        events.forEach(([event, handler]) => {
          mouseElement.addEventListener(event, handler);
          detachDomListeners.push(() => mouseElement.removeEventListener(event, handler));
        });
      }

      const afterUpdateHandler = () => {
        dynamicBodies.forEach((body) => {
          const halfW = (body.bounds.max.x - body.bounds.min.x) / 2;
          const halfH = (body.bounds.max.y - body.bounds.min.y) / 2;
          const minX = halfW;
          const maxX = containerWidth - halfW;
          const minY = halfH;
          const maxY = CANVAS_HEIGHT - halfH;

          let clamped = false;
          let newX = body.position.x;
          let newY = body.position.y;

          if (body.position.x < minX) {
            newX = minX;
            clamped = true;
          } else if (body.position.x > maxX) {
            newX = maxX;
            clamped = true;
          }

          if (body.position.y < minY) {
            newY = minY;
            clamped = true;
          } else if (body.position.y > maxY) {
            newY = maxY;
            clamped = true;
          }

          if (clamped) {
            Matter.Body.setPosition(body, { x: newX, y: newY });
            Matter.Body.setVelocity(body, { x: body.velocity.x * 0.3, y: body.velocity.y * 0.3 });
          }
        });
      };
      Matter.Events.on(engine, 'afterUpdate', afterUpdateHandler);

      const cleanup = () => {
        detachDomListeners.forEach((fn) => fn());
        Matter.Events.off(mouseConstraint, 'startdrag', startDragHandler as any);
        Matter.Events.off(mouseConstraint, 'enddrag', endDragHandler as any);
        Matter.Events.off(engine, 'afterUpdate', afterUpdateHandler as any);
      };

      simulationRef.current = { engine, runner, render, mouseConstraint, cleanup };
      hasInitializedRef.current = true;
    };

    initSimulation();

    return () => {
      cancelled = true;
    };
  }, [isVisible, simVersion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsVisible(entry.isIntersecting));
      },
      { threshold: 0.35, rootMargin: '200px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      destroySimulation();
    };
  }, []);

  // Force remove borders from canvas and container to override global CSS
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.style.setProperty('border', 'none', 'important');
      canvas.style.setProperty('border-top', 'none', 'important');
      canvas.style.setProperty('border-right', 'none', 'important');
      canvas.style.setProperty('border-bottom', 'none', 'important');
      canvas.style.setProperty('border-left', 'none', 'important');
      canvas.style.setProperty('outline', 'none', 'important');
    }
    if (containerRef.current) {
      const container = containerRef.current;
      container.style.setProperty('border', 'none', 'important');
      container.style.setProperty('border-top', 'none', 'important');
      container.style.setProperty('border-right', 'none', 'important');
      container.style.setProperty('border-bottom', 'none', 'important');
      container.style.setProperty('border-left', 'none', 'important');
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let resizeTimeout: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        destroySimulation();
        setSimVersion((prev) => prev + 1);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) clearTimeout(resizeTimeout);
    };
  }, [isVisible]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full pb-2" 
      style={{ 
        border: 'none !important',
        borderTop: 'none !important',
        borderRight: 'none !important',
        borderBottom: 'none !important',
        borderLeft: 'none !important'
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ 
          display: 'block', 
          border: 'none !important',
          borderTop: 'none !important',
          borderRight: 'none !important',
          borderBottom: 'none !important',
          borderLeft: 'none !important',
          outline: 'none !important', 
          background: 'transparent'
        }}
      />
    </div>
  );
}
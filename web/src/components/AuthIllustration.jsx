const palette = {
  deep: '#0A5C41',
  mid: '#0D7A57',
  mint: '#E6F4EA',
  slate: '#1A202C',
  slateSoft: '#4A5568',
  line: '#E2E8F0',
  lineSoft: '#EDF2F7',
  canvas: '#F1F7F4',
  white: '#FFFFFF',
  amber: '#D97706',
};

function Backdrop() {
  return (
    <>
      <rect width="480" height="360" fill={palette.canvas} />
      <circle cx="408" cy="48" r="96" fill={palette.mint} />
      <circle cx="52" cy="322" r="68" fill={palette.mint} opacity="0.75" />
      <g fill="#CBD5E1">
        {[0, 1, 2, 3].map((column) =>
          [0, 1, 2].map((row) => (
            <circle
              key={`${column}-${row}`}
              cx={42 + column * 15}
              cy={44 + row * 15}
              r="1.8"
            />
          )),
        )}
      </g>
    </>
  );
}

function LoginScene() {
  return (
    <>
      <Backdrop />
      <ellipse
        cx="192"
        cy="310"
        rx="120"
        ry="10"
        fill={palette.deep}
        opacity="0.08"
      />

      <rect
        x="96"
        y="57"
        width="188"
        height="240"
        rx="24"
        fill={palette.white}
        stroke={palette.line}
        strokeWidth="1.5"
      />
      <rect x="96" y="57" width="188" height="8" rx="4" fill={palette.deep} />

      <circle cx="190" cy="112" r="21" fill={palette.mint} />
      <rect x="182" y="110" width="16" height="12" rx="3" fill={palette.deep} />
      <path
        d="M185.5 110v-4.5a4.5 4.5 0 0 1 9 0v4.5"
        fill="none"
        stroke={palette.deep}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect x="150" y="143" width="80" height="8" rx="4" fill="#CBD5E1" />
      <rect x="161" y="157" width="58" height="6" rx="3" fill={palette.line} />

      <rect
        x="116"
        y="178"
        width="148"
        height="30"
        rx="9"
        fill="#F8FAFC"
        stroke={palette.line}
        strokeWidth="1.5"
      />
      <circle cx="133" cy="193" r="5" fill={palette.mid} opacity="0.35" />
      <rect x="147" y="190" width="78" height="6" rx="3" fill={palette.line} />

      <rect
        x="116"
        y="216"
        width="148"
        height="30"
        rx="9"
        fill="#F8FAFC"
        stroke={palette.line}
        strokeWidth="1.5"
      />
      <circle cx="133" cy="231" r="5" fill={palette.mid} opacity="0.35" />
      <rect x="147" y="228" width="62" height="6" rx="3" fill={palette.line} />

      <rect x="116" y="258" width="148" height="32" rx="9" fill={palette.deep} />
      <rect
        x="134"
        y="271"
        width="42"
        height="6"
        rx="3"
        fill={palette.white}
        opacity="0.9"
      />
      <path
        d="M216 274h14m-5-5 5 5-5 5"
        fill="none"
        stroke={palette.white}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g transform="translate(320 164) rotate(-18)">
        <circle r="30" fill={palette.mid} />
        <circle r="12" fill={palette.canvas} />
        <rect x="26" y="-7" width="86" height="14" rx="7" fill={palette.mid} />
        <rect x="84" y="7" width="14" height="21" rx="4" fill={palette.mid} />
        <rect x="64" y="7" width="12" height="15" rx="4" fill={palette.mid} />
        <rect
          x="33"
          y="-4.5"
          width="48"
          height="3.5"
          rx="1.75"
          fill={palette.white}
          opacity="0.3"
        />
      </g>

      <g transform="translate(386 232)">
        <path
          d="M0 0h58v27c0 20-17 34-29 39C17 61 0 47 0 27Z"
          fill={palette.deep}
        />
        <path
          d="M18 29l8 9 16-18"
          fill="none"
          stroke={palette.white}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      <path
        d="M348 74c0 5 3 8 8 8-5 0-8 3-8 8 0-5-3-8-8-8 5 0 8-3 8-8Z"
        fill={palette.mid}
        opacity="0.45"
      />
      <path
        d="M372 104c0 4 2 6 6 6-4 0-6 2-6 6 0-4-2-6-6-6 4 0 6-2 6-6Z"
        fill={palette.mid}
        opacity="0.3"
      />
    </>
  );
}

function StudentScene() {
  return (
    <>
      <Backdrop />
      <ellipse
        cx="238"
        cy="306"
        rx="150"
        ry="10"
        fill={palette.deep}
        opacity="0.08"
      />

      <path
        d="M91 152v-7a10 10 0 0 1 20 0v7"
        fill="none"
        stroke={palette.deep}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <rect x="46" y="148" width="88" height="116" rx="26" fill={palette.mid} />
      <rect x="58" y="194" width="64" height="52" rx="16" fill={palette.deep} />
      <rect
        x="58"
        y="194"
        width="64"
        height="10"
        rx="5"
        fill={palette.white}
        opacity="0.16"
      />

      <g transform="translate(292 44) rotate(10)">
        <path d="M52 0 100 20 52 40 4 20Z" fill={palette.deep} />
        <path d="M28 27v12c0 9 48 9 48 0V27" fill={palette.mid} />
        <path
          d="M100 20v20"
          stroke={palette.deep}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="100" cy="44" r="5" fill={palette.amber} />
      </g>

      <rect x="146" y="104" width="188" height="128" rx="14" fill={palette.slate} />
      <rect x="156" y="114" width="168" height="108" rx="8" fill={palette.white} />
      <rect x="170" y="130" width="56" height="7" rx="3.5" fill={palette.deep} />

      <circle cx="176" cy="156" r="8" fill={palette.mint} />
      <path
        d="M172.5 156l2.5 2.5 4.5-5"
        fill="none"
        stroke={palette.mid}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="192" y="152" width="110" height="7" rx="3.5" fill={palette.line} />

      <circle cx="176" cy="180" r="8" fill={palette.mint} />
      <path
        d="M172.5 180l2.5 2.5 4.5-5"
        fill="none"
        stroke={palette.mid}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="192" y="176" width="86" height="7" rx="3.5" fill={palette.line} />

      <rect x="170" y="202" width="140" height="7" rx="3.5" fill={palette.lineSoft} />
      <rect x="170" y="202" width="88" height="7" rx="3.5" fill={palette.mid} />

      <rect x="124" y="232" width="232" height="13" rx="6.5" fill={palette.slate} />
      <rect x="222" y="232" width="36" height="4" rx="2" fill={palette.slateSoft} />

      <g transform="translate(354 122)">
        <rect
          width="54"
          height="54"
          rx="14"
          fill={palette.white}
          stroke={palette.line}
          strokeWidth="1.5"
        />
        <path d="M23 18l16 9-16 9Z" fill={palette.mid} />
      </g>

      <g>
        <rect x="360" y="272" width="100" height="14" rx="4" fill={palette.line} />
        <rect x="370" y="256" width="92" height="14" rx="4" fill={palette.slateSoft} />
        <rect x="380" y="240" width="84" height="14" rx="4" fill={palette.mid} />
        <rect
          x="392"
          y="243"
          width="56"
          height="3"
          rx="1.5"
          fill={palette.white}
          opacity="0.35"
        />
      </g>

      <circle cx="112" cy="112" r="18" fill={palette.deep} />
      <path
        d="M104.5 112l5 5 9-10"
        fill="none"
        stroke={palette.white}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function InstructorScene() {
  return (
    <>
      <Backdrop />
      <ellipse
        cx="238"
        cy="308"
        rx="152"
        ry="10"
        fill={palette.deep}
        opacity="0.08"
      />

      <path
        d="M124 240l-13 60M292 240l13 60"
        stroke={palette.slate}
        strokeWidth="9"
        strokeLinecap="round"
      />

      <rect
        x="84"
        y="70"
        width="248"
        height="172"
        rx="16"
        fill={palette.white}
        stroke={palette.line}
        strokeWidth="2"
      />

      <rect x="108" y="94" width="88" height="8" rx="4" fill={palette.deep} />
      <rect x="108" y="110" width="56" height="6" rx="3" fill={palette.line} />

      <circle cx="300" cy="102" r="16" fill={palette.deep} />
      <path d="M296 95l10 7-10 7Z" fill={palette.white} />

      <rect x="108" y="176" width="24" height="32" rx="6" fill="#CFE9DD" />
      <rect x="142" y="154" width="24" height="54" rx="6" fill={palette.mid} />
      <rect x="176" y="134" width="24" height="74" rx="6" fill={palette.deep} />
      <path d="M104 210h112" stroke={palette.line} strokeWidth="2" strokeLinecap="round" />

      {[
        { y: 144, width: 64 },
        { y: 168, width: 52 },
        { y: 192, width: 58 },
      ].map((row) => (
        <g key={row.y}>
          <circle cx="238" cy={row.y} r="8" fill={palette.mint} />
          <path
            d={`M234.5 ${row.y}l2.5 2.5 4.5-5`}
            fill="none"
            stroke={palette.mid}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="254"
            y={row.y - 3.5}
            width={row.width}
            height="7"
            rx="3.5"
            fill={palette.line}
          />
        </g>
      ))}

      <g transform="translate(356 92)">
        <rect
          width="88"
          height="64"
          rx="14"
          fill={palette.white}
          stroke={palette.line}
          strokeWidth="1.5"
        />
        <circle cx="27" cy="26" r="8" fill={palette.mid} />
        <path d="M15 48c0-8 5.4-12 12-12s12 4 12 12" fill={palette.mid} opacity="0.85" />
        <rect x="52" y="21" width="24" height="6" rx="3" fill={palette.line} />
        <rect x="52" y="35" width="16" height="6" rx="3" fill={palette.lineSoft} />
      </g>

      <g transform="translate(368 178)">
        <rect
          width="88"
          height="64"
          rx="14"
          fill={palette.white}
          stroke={palette.line}
          strokeWidth="1.5"
        />
        <path
          d="M24 46V38M38 46V30M52 46V22"
          stroke={palette.mid}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="70" cy="22" r="5" fill={palette.amber} />
      </g>

      <path
        d="M344 68c0 4.5 2.5 7 7 7-4.5 0-7 2.5-7 7 0-4.5-2.5-7-7-7 4.5 0 7-2.5 7-7Z"
        fill={palette.mid}
        opacity="0.4"
      />
    </>
  );
}

const scenes = {
  login: {
    title: 'Inicio de sesión seguro',
    scene: LoginScene,
  },
  estudiante: {
    title: 'Estudiante con laptop, libros y birrete',
    scene: StudentScene,
  },
  instructor: {
    title: 'Instructor creando un curso',
    scene: InstructorScene,
  },
};

export default function AuthIllustration({ variant = 'login', className = '' }) {
  const entry = scenes[variant] ?? scenes.login;
  const Scene = entry.scene;

  return (
    <svg
      viewBox="0 0 480 360"
      role="img"
      className={`block h-auto w-full ${className}`}
    >
      <title>{entry.title}</title>
      <Scene />
    </svg>
  );
}

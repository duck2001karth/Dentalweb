declare namespace JSX {
  interface IntrinsicElements {
    'df-messenger': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'project-id'?: string;
      'agent-id'?: string;
      'location'?: string;
      'language-code'?: string;
      'intent'?: string;
      'chat-title'?: string;
      'chat-icon'?: string;
      'wait-open'?: string | boolean; 
      // Puedes añadir más atributos específicos de df-messenger si los necesitas
    };
  }
}
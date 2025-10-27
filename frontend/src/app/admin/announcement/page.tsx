'use client';

import { useState, useRef, useEffect } from 'react';
import { IBM_Plex_Sans } from 'next/font/google';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

interface FormatButton {
  command: string;
  icon: string;
  label: string;
  value?: string;
}

const formatButtons: FormatButton[] = [
  { command: 'bold', icon: 'B', label: 'Bold' },
  { command: 'italic', icon: 'I', label: 'Italic' },
  { command: 'underline', icon: 'U', label: 'Underline' },
  { command: 'insertUnorderedList', icon: '•', label: 'Bullet List' },
  { command: 'formatBlock', icon: 'H1', label: 'Heading 1', value: 'h1' },
  { command: 'formatBlock', icon: 'H2', label: 'Heading 2', value: 'h2' },
];

export default function AnnouncementPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  // Check which formats are currently active
  const updateActiveFormats = () => {
    const formats = new Set<string>();

    try {
      if (document.queryCommandState('bold')) formats.add('bold');
      if (document.queryCommandState('italic')) formats.add('italic');
      if (document.queryCommandState('underline')) formats.add('underline');
      if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    } catch (error) {
      // Ignore errors for unsupported commands
    }

    setActiveFormats(formats);
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const executeCommand = (command: string, value?: string) => {
    try {
      // Focus the editor first
      if (editorRef.current) {
        editorRef.current.focus();
      }

      // Special handling for different commands
      if (command === 'insertUnorderedList') {
        document.execCommand(command, false);
      } else if (command === 'formatBlock') {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false, value);
      }

      // Update active formats after command
      setTimeout(updateActiveFormats, 10);

    } catch (error) {
      console.warn('execCommand not supported:', command, error);
    }
  };

  const handleFormatClick = (button: FormatButton) => {
    executeCommand(button.command, button.value);

    // Update content after formatting
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setContent(target.innerHTML);
    updateActiveFormats();
  };

  const handleSend = () => {
    if (!title.trim()) {
      toast.error('Please enter an announcement title');
      return;
    }

    if (!content.trim() || content === '<br>' || content === '<div><br></div>') {
      toast.error('Please enter announcement content');
      return;
    }

    console.log('Sending announcement:', { title, content });

    toast.success('Announcement Sent!', {
      description: `Your announcement "${title}" has been sent successfully.`,
      duration: 3000,
    });

    // Reset form
    setTitle('');
    setContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  return (
    <div
      className="min-h-screen text-white p-4"
      style={{ minHeight: '100vh' }}
    >
      <div className={`h-screen max-h-screen flex flex-col ${ibmPlexSans.variable} font-sans overflow-hidden`}>
        {/* Transparent Glass Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mx-2 mt-0 mb-2 shadow-2xl flex flex-col overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          {/* Header with Title Input */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-shrink-0 relative mb-6"
          >
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-white flex-shrink-0">Create Announcement</h1>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title..."
                  className="w-full h-12 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 
                           border border-purple-500/30 focus:border-purple-400/50 text-white placeholder-gray-400 
                           rounded-xl text-lg px-4 py-3 focus:ring-0 focus:outline-none transition-all duration-300
                           backdrop-blur-sm shadow-lg shadow-purple-500/10"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl pointer-events-none" />
              </div>
            </div>
          </motion.div>

          {/* Rich Text Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <label className="block text-lg font-medium text-white mb-3">
              Content
            </label>

            {/* Enhanced Formatting Toolbar */}
            <div className="flex-shrink-0 mb-4">
              <div className="inline-flex items-center gap-2 p-3 bg-transparent border border-gray-600/20 rounded-lg backdrop-blur-sm">
                {formatButtons.map((button) => (
                  <motion.button
                    key={button.command + button.icon}
                    onClick={() => handleFormatClick(button)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-9 border rounded-md transition-all duration-200 flex items-center justify-center text-sm font-bold
                      ${activeFormats.has(button.command)
                        ? 'bg-purple-600/50 border-purple-500/70 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-transparent hover:bg-purple-600/20 border-gray-600/20 hover:border-purple-500/50 text-white'
                      }
                      ${button.icon === 'H1' ? 'text-lg font-black' : ''}
                      ${button.icon === 'H2' ? 'text-base font-bold' : ''}
                      ${button.icon === 'B' ? 'font-black' : ''}
                      ${button.icon === 'I' ? 'italic' : ''}
                      ${button.icon === 'U' ? 'underline decoration-purple-400' : ''}
                      ${button.icon === '•' ? 'text-lg' : ''}`}
                    title={button.label}
                  >
                    {button.icon}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Enhanced Content Editor */}
            <div className="flex-1 relative min-h-0">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full h-full bg-transparent border border-gray-600/20 focus:border-purple-400/50 
                         text-white rounded-xl p-4 focus:ring-0 focus:outline-none transition-all duration-300
                         backdrop-blur-sm overflow-y-auto resize-none text-base leading-relaxed
                         [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:my-3 [&_h1]:leading-tight
                         [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:my-2 [&_h2]:leading-snug
                         [&_strong]:font-bold [&_strong]:text-white [&_b]:font-bold [&_b]:text-white
                         [&_em]:italic [&_em]:text-gray-300 [&_i]:italic [&_i]:text-gray-300
                         [&_u]:underline [&_u]:decoration-purple-400 [&_u]:decoration-2
                         [&_ul]:my-3 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:list-inside
                         [&_li]:my-1 [&_li]:text-white [&_li]:leading-relaxed
                         [&_p]:my-2 [&_p]:leading-relaxed"
                style={{
                  minHeight: '200px',
                }}
                onInput={handleInput}
                onKeyUp={updateActiveFormats}
                onMouseUp={updateActiveFormats}
              />
              {content === '' && (
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  Write your announcement content here... Use the toolbar above for formatting.
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-xl pointer-events-none" />
            </div>

            {/* Send Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex-shrink-0 mt-4 flex justify-end"
            >
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!title.trim() || !content.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 
                         hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-500 text-white rounded-xl 
                         text-lg font-medium transition-all duration-300 shadow-lg shadow-purple-500/25 
                         disabled:shadow-none backdrop-blur-sm border border-purple-500/30 
                         disabled:border-gray-500/30"
              >
                Send Announcement
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
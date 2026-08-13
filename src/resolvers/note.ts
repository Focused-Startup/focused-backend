import prisma from '../db/client';

interface NoteArgs {
    id: number;
    content: string;
    authorId: number;
}

export const NotesResolvers = {
    Query: {
        notes: async (_: any, args: NoteArgs) => {
            const { authorId } = args;
            try {
                const notes = await prisma.note.findMany({ where: { authorId } });
                return { success: true, total: notes.length, notes };
            } catch (error) {
                console.error('Error fetching notes:', error);
                return { success: false, total: 0, notes: [] };
            }
        },
        note: async (_: any, args: NoteArgs) => {
            const { id } = args;
            try {
                return await prisma.note.findUnique({ where: { id } });
            } catch (error) {
                console.error(`Error fetching note with id ${id}:`, error);
                return null;
            }
        }
    },
    Mutation: {
        addNote: async (_: any, args: NoteArgs) => {
            const { content, authorId } = args;
            try {
                return await prisma.note.create({
                    data: { content, authorId, createdAt: new Date(), updatedAt: new Date() }
                });
            } catch (error) {
                console.error('Error creating note:', error);
                return null;
            }
        },
        updateNote: async (_: any, args: NoteArgs) => {
            const { id, content } = args;
            try {
                return await prisma.note.update({
                    where: { id },
                    data: { content, updatedAt: new Date() }
                });
            } catch (error) {
                console.error(`Error updating note with id ${id}:`, error);
                return null;
            }
        },
        deleteNote: async (_: any, args: NoteArgs) => {
            const { id } = args;
            try {
                await prisma.note.delete({ where: { id } });
                return { success: true, message: 'Note deleted successfully', id };
            } catch (error) {
                console.error(`Error deleting note with id ${id}:`, error);
                return { success: false, message: 'Error deleting note', id };
            }
        }
    }
};

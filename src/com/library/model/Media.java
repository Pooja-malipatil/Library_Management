package com.library.model;

/**
 * Represents a digital media item (book, DVD, magazine, etc.).
 */
public class Media {
    private int    id;
    private String title;
    private String creator;
    private String mediaType;
    private String genre;
    private int    releaseYear;
    private int    totalCopies;
    private int    available;

    public Media() {}

    public Media(String title, String creator, String mediaType,
                 String genre, int releaseYear, int totalCopies, int available) {
        this.title       = title;
        this.creator     = creator;
        this.mediaType   = mediaType;
        this.genre       = genre;
        this.releaseYear = releaseYear;
        this.totalCopies = totalCopies;
        this.available   = available;
    }

    // ── Getters & Setters ─────────────────────────────────
    public int    getId()          { return id; }
    public void   setId(int id)    { this.id = id; }

    public String getTitle()             { return title; }
    public void   setTitle(String t)     { this.title = t; }

    public String getCreator()           { return creator; }
    public void   setCreator(String c)   { this.creator = c; }

    public String getMediaType()         { return mediaType; }
    public void   setMediaType(String m) { this.mediaType = m; }

    public String getGenre()             { return genre; }
    public void   setGenre(String g)     { this.genre = g; }

    public int    getReleaseYear()       { return releaseYear; }
    public void   setReleaseYear(int y)  { this.releaseYear = y; }

    public int    getTotalCopies()       { return totalCopies; }
    public void   setTotalCopies(int n)  { this.totalCopies = n; }

    public int    getAvailable()         { return available; }
    public void   setAvailable(int a)    { this.available = a; }

    @Override
    public String toString() {
        return String.format(
            "[%d] %-40s | %-12s | %-25s | Copies: %d/%d",
            id, title, mediaType, creator, available, totalCopies);
    }
}

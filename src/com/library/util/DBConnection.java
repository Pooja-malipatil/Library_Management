package com.library.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Singleton JDBC connection manager.
 * Establishes a high-speed connection to MySQL — resume bullet 1.
 */
public class DBConnection {

    private static final String URL      = "jdbc:mysql://localhost:3306/library_ledger?useSSL=false&serverTimezone=UTC";
    private static final String USER     = "root";   // change as needed
    private static final String PASSWORD = "mysql123!";   // change as needed

    private static Connection connection;

    private DBConnection() {}   // prevent instantiation

    public static Connection getConnection() throws SQLException {
        if (connection == null || connection.isClosed()) {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
                System.out.println("[DB] Connection established.");
            } catch (ClassNotFoundException e) {
                throw new SQLException("MySQL JDBC Driver not found. Add mysql-connector-java to classpath.", e);
            }
        }
        return connection;
    }

    public static void closeConnection() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                System.out.println("[DB] Connection closed.");
            }
        } catch (SQLException e) {
            System.err.println("[DB] Error closing connection: " + e.getMessage());
        }
    }
}